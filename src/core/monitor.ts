import { defaultOptions } from "../types";
import { createCpuSampler } from "../collectors/cpu";
import { createProcessSampler } from "../collectors/process";
import { collectDiskSpace } from "../collectors/disk";
import { getMemoryUsage } from "../memoryUsage";
import { getNetworkInfo } from "../networkInfo";
import { getSystemUptime } from "../uptime";
import { getOSInfo } from "../osInfo";
import { getLoadAverage } from "../loadAverage";
import { getUserInfo } from "../userInfo";
import { getTemperature } from "../temperature";
import { getFileSystemInfo } from "../fileSystemInfo";
import { getActiveConnections } from "../activeConnections";
import { getScheduledTasks } from "../scheduledTasks";
import { getLogs } from "../logs";
import { CapabilityUnavailableError } from "../platforms/command";
import type {
  MetricName,
  MetricResult,
  Monitor,
  MonitorConfig,
  Snapshot,
  SnapshotMetrics,
} from "./contracts";

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function positive(value: number, name: string, max: number): number {
  if (!Number.isInteger(value) || value < 1 || value > max)
    throw new RangeError(`${name} must be an integer between 1 and ${max}`);
  return value;
}

/** Per-instance baselines, bounded async collection and explicit lifecycle. */
export function createMonitor(config: MonitorConfig = {}): Monitor {
  const intervalMs = positive(
    config.intervalMs ?? 1000,
    "intervalMs",
    86400000,
  );
  const timeoutMs = positive(
    config.collectorTimeoutMs ?? 2000,
    "collectorTimeoutMs",
    60000,
  );
  const concurrency = positive(config.concurrency ?? 4, "concurrency", 16);
  const diskPaths = [...(config.diskPaths ?? [process.cwd()])];
  if (
    !diskPaths.length ||
    diskPaths.length > 100 ||
    diskPaths.some((p) => typeof p !== "string" || !p.length)
  )
    throw new TypeError("diskPaths requires 1 to 100 nonempty paths");
  const options = {
    ...defaultOptions,
    ...Object.fromEntries(
      Object.entries(config.metrics ?? {}).filter(
        ([, value]) => value !== undefined,
      ),
    ),
    ...(config.metrics?.logs ? { logs: { ...config.metrics.logs } } : {}),
  };
  if (options.logs) {
    if (typeof options.logs.path !== "string" || !options.logs.path)
      throw new TypeError("logs.path is required");
    if (
      options.logs.keyword !== undefined &&
      typeof options.logs.keyword !== "string"
    )
      throw new TypeError("logs.keyword must be a string");
    positive(
      options.logs.maxBytes ?? 1024 * 1024,
      "logs.maxBytes",
      16 * 1024 * 1024,
    );
    positive(options.logs.maxLines ?? 1000, "logs.maxLines", 10000);
  }
  for (const [key, value] of Object.entries(options)) {
    if (key === "logs") continue;
    if (key === "responseTime")
      throw new TypeError("responseTime belongs to the HTTP adapter");
    if (!Object.hasOwn(defaultOptions, key))
      throw new TypeError(`Unknown metric: ${key}`);
    if (typeof value !== "boolean")
      throw new TypeError(`${key} must be boolean`);
  }
  const cpu = createCpuSampler();
  const processSampler = createProcessSampler();
  type Collector = {
    name: MetricName;
    scope: "host" | "process" | "filesystem" | "user";
    run: (signal: AbortSignal) => unknown;
  };
  const collectors: Collector[] = [
    { name: "cpu", scope: "host", run: () => cpu.sample() },
    { name: "memory", scope: "host", run: getMemoryUsage },
    {
      name: "disk",
      scope: "filesystem",
      run: (signal: AbortSignal) => collectDiskSpace(diskPaths, signal),
    },
    { name: "network", scope: "host", run: getNetworkInfo },
    { name: "uptime", scope: "host", run: getSystemUptime },
    {
      name: "processInfo",
      scope: "process",
      run: () => processSampler.sample(),
    },
    {
      name: "temperature",
      scope: "host",
      run: (signal: AbortSignal) => getTemperature(signal),
    },
    { name: "osInfo", scope: "host", run: getOSInfo },
    {
      name: "loadAverage",
      scope: "host",
      run: () => {
        if (process.platform === "win32")
          throw new CapabilityUnavailableError(
            "Load average is unavailable on Windows",
          );
        return getLoadAverage();
      },
    },
    { name: "userInfo", scope: "user", run: getUserInfo },
    {
      name: "fileSystemInfo",
      scope: "filesystem",
      run: (signal: AbortSignal) => getFileSystemInfo("json", signal),
    },
    {
      name: "activeConnections",
      scope: "host",
      run: (signal: AbortSignal) => getActiveConnections("json", signal),
    },
    {
      name: "scheduledTasks",
      scope: "user",
      run: (signal: AbortSignal) => getScheduledTasks(signal),
    },
    {
      name: "logs",
      scope: "user",
      run: (signal: AbortSignal) =>
        getLogs(options.logs!.path, options.logs!.keyword, {
          maxBytes: options.logs!.maxBytes,
          maxLines: options.logs!.maxLines,
          signal,
        }),
    },
  ].filter((c) => options[c.name as keyof typeof options]) as Collector[];
  let snapshot: Snapshot | null = null;
  let snapshotTime = 0;
  let inFlight: Promise<Snapshot> | undefined;
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let starting: Promise<Snapshot> | undefined;
  let stopping: Promise<void> | undefined;
  let generation = 0;
  const pending = new Map<MetricName, Promise<unknown>>();
  async function execute(
    c: Collector,
    parent: AbortSignal,
  ): Promise<MetricResult<unknown>> {
    const started = performance.now();
    const abort = new AbortController();
    const cancel = () => abort.abort(parent.reason);
    parent.addEventListener("abort", cancel, { once: true });
    if (parent.aborted) cancel();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let rejectAbort: ((reason: unknown) => void) | undefined;
    const onAbort = () =>
      rejectAbort?.(abort.signal.reason ?? new Error("Collection aborted"));
    const base = () => ({
      sampledAt: new Date().toISOString(),
      durationMs: performance.now() - started,
      scope: c.scope,
    });
    try {
      const cancellation = new Promise<never>((_, reject) => {
        rejectAbort = reject;
      });
      abort.signal.addEventListener("abort", onAbort, { once: true });
      deadline = setTimeout(
        () =>
          abort.abort(
            Object.assign(new Error("Collector timed out"), {
              code: "TIMEOUT",
            }),
          ),
        timeoutMs,
      );
      abort.signal.throwIfAborted();
      if (pending.has(c.name)) {
        return {
          ...base(),
          status: "error",
          error: {
            code: "COLLECTOR_BUSY",
            message: "Previous timed-out collection is still finishing",
          },
        };
      }
      const work = Promise.resolve()
        .then(() => {
          abort.signal.throwIfAborted();
          return c.run(abort.signal);
        })
        .finally(() => {
          pending.delete(c.name);
        });
      pending.set(c.name, work);
      const value = await Promise.race([work, cancellation]);
      if (value === undefined)
        return {
          ...base(),
          status:
            c.name === "cpu" || c.name === "processInfo"
              ? "warming_up"
              : "unavailable",
          reason:
            c.name === "cpu" || c.name === "processInfo"
              ? "Two valid samples are required"
              : "Capability unavailable",
        };
      return { ...base(), status: "ok", value };
    } catch (error) {
      if (error instanceof CapabilityUnavailableError)
        return { ...base(), status: "unavailable", reason: error.message };
      const e = error as { code?: unknown; message?: string };
      return {
        ...base(),
        status: "error",
        error: {
          code: String(e?.code ?? "COLLECTION_FAILED"),
          message: e?.message ?? String(error),
        },
      };
    } finally {
      clearTimeout(deadline);
      parent.removeEventListener("abort", cancel);
      abort.signal.removeEventListener("abort", onAbort);
    }
  }
  const collect = (): Promise<Snapshot> => {
    if (stopping) return stopping.then(collect);
    if (inFlight) return inFlight;
    const cycle = new AbortController();
    controller = cycle;
    const currentGeneration = generation;
    inFlight = (async () => {
      const metrics: Record<string, MetricResult<unknown>> = {};
      let index = 0;
      await Promise.all(
        Array.from(
          { length: Math.min(concurrency, collectors.length) },
          async () => {
            while (index < collectors.length && !cycle.signal.aborted) {
              const c = collectors[index++];
              metrics[c.name] = await execute(c, cycle.signal);
            }
          },
        ),
      );
      const value = freeze({
        sampledAt: new Date().toISOString(),
        ageMs: 0,
        stale: false,
        metrics: metrics as SnapshotMetrics,
      });
      if (currentGeneration === generation && !cycle.signal.aborted) {
        snapshot = value;
        snapshotTime = performance.now();
      }
      return value;
    })().finally(() => {
      inFlight = undefined;
      controller = undefined;
    });
    return inFlight;
  };
  const getSnapshot = (maxAgeMs = intervalMs * 2): Snapshot | null => {
    if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0)
      throw new RangeError("maxAgeMs must be nonnegative");
    if (!snapshot) return null;
    const ageMs = Math.max(0, performance.now() - snapshotTime);
    return Object.freeze({ ...snapshot, ageMs, stale: ageMs > maxAgeMs });
  };
  const startMonitor = (): Promise<Snapshot> => {
    if (stopping) return stopping.then(startMonitor);
    if (starting) return starting;
    if (timer) return Promise.resolve(getSnapshot()!);
    const currentGeneration = generation;
    starting = collect()
      .then((value) => {
        if (currentGeneration === generation) {
          timer = setInterval(() => {
            void collect();
          }, intervalMs);
          timer.unref();
        }
        return value;
      })
      .finally(() => {
        starting = undefined;
      });
    return starting;
  };
  const stop = (): Promise<void> => {
    if (stopping) return stopping;
    generation++;
    clearInterval(timer);
    timer = undefined;
    controller?.abort(new Error("Monitor stopped"));
    stopping = Promise.resolve(inFlight)
      .finally(() => {
        cpu.reset();
        processSampler.reset();
        stopping = undefined;
      })
      .then(() => {});
    return stopping;
  };
  return { collect, getSnapshot, start: startMonitor, stop };
}
