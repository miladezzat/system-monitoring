import type {
  MonitorRequest,
  MonitorResponse,
  NextFunction,
} from "./httpTypes";
import type { MonitorData, MonitorOptions } from "./types";
import type { Monitor, MonitorConfig, Snapshot } from "./core/contracts";
import { createMonitor } from "./core/monitor";
import { trackRequestResponseTime } from "./trackRequestResponseTime";

function legacyData(snapshot: Snapshot | null): MonitorData {
  const data: Record<string, unknown> = {};
  const names = {
    cpu: "cpuInformation",
    memory: "memoryUsage",
    disk: "diskUsage",
    network: "networkInfo",
  };
  for (const [key, result] of Object.entries(snapshot?.metrics ?? {})) {
    if (result?.status !== "ok") continue;
    let value: unknown = result.value;
    if (key === "disk")
      value = (
        result.value as readonly import("./core/contracts").DiskSpace[]
      ).map((d) => ({
        filesystem: d.path,
        mountPoint: d.path,
        total: d.totalBytes,
        used: d.usedBytes,
        available: d.availableBytes,
        usedPercentage: d.usedPercent,
      }));
    if (key === "processInfo") {
      const p = result.value as import("./core/contracts").ProcessMetrics;
      value = {
        cpu: p.cpuTimeMs,
        cpuTimeMs: p.cpuTimeMs,
        cpuPercent: p.cpuPercent,
        memory: p.memoryBytes,
      };
    }
    data[names[key as keyof typeof names] ?? key] = value;
  }
  return data as MonitorData;
}
/** Read only cached snapshots. Start the monitor before mounting this adapter. */
export function createMonitorMiddleware(monitor: Monitor, maxAgeMs?: number) {
  if (maxAgeMs !== undefined && (!Number.isFinite(maxAgeMs) || maxAgeMs < 0))
    throw new RangeError("maxAgeMs must be nonnegative");
  return (
    req: MonitorRequest,
    _res: MonitorResponse,
    next: NextFunction,
  ): void => {
    req.systemSnapshot = monitor.getSnapshot(maxAgeMs);
    req.systemMetrics = legacyData(req.systemSnapshot);
    next();
  };
}
/** Compatibility factory with an explicit lifecycle; no collection on requests. */
export function systemMonitor(
  options: MonitorOptions = {},
  config: Omit<MonitorConfig, "metrics"> = {},
) {
  const { responseTime, ...metrics } = options;
  if (responseTime !== undefined && typeof responseTime !== "boolean")
    throw new TypeError("responseTime must be boolean");
  const monitor = createMonitor({ ...config, metrics });
  const attach = createMonitorMiddleware(monitor);
  const timing = responseTime ? trackRequestResponseTime() : undefined;
  const middleware = (
    req: MonitorRequest,
    res: MonitorResponse,
    next: NextFunction,
  ): void => {
    if (timing) timing(req, res, () => attach(req, res, next));
    else attach(req, res, next);
  };
  return Object.assign(middleware, {
    start: () => monitor.start(),
    stop: () => monitor.stop(),
    collect: () => monitor.collect(),
    getSnapshot: (maxAgeMs?: number) => monitor.getSnapshot(maxAgeMs),
  });
}
export default systemMonitor;
