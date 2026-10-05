# system-monitoring

A Node.js library for system and process metrics, with zero runtime dependencies and optional Express middleware. Node.js 22 or newer is required. CommonJS, native ESM imports, and TypeScript declarations are supported.

```sh
npm install system-monitoring
```

## Collect metrics

```ts
import { createMonitor } from "system-monitoring";

const monitor = createMonitor({
  intervalMs: 1000,
  collectorTimeoutMs: 2000,
  diskPaths: [process.cwd()],
  metrics: { cpu: true, memory: true, disk: true },
});

await monitor.start();
// CPU and process utilization need two valid samples. The first is warming_up.
const snapshot = monitor.getSnapshot();
console.log(snapshot?.metrics.memory);

// At application shutdown:
await monitor.stop();
```

`collect()` performs one collection cycle without starting a timer. Concurrent calls share that cycle. A timed-out collector still finishing native I/O is reported as `COLLECTOR_BUSY` until it settles, so another cycle cannot launch more work for that collector. `start()` collects once and starts an unref'ed periodic timer; `stop()` clears it and cancels the current collection. Constructing a monitor and importing the package perform no collection.

Partial `metrics` options merge with the defaults: CPU, memory, disk, interface metadata, uptime, and process metrics are enabled. Temperature, OS/user details, load averages, mounted-volume information, active connections, scheduled tasks, and log reading are opt-in. To disable a default metric, set it to `false`.

Each metric has a sample timestamp, collection duration, scope, and one of four statuses:

| Status        | Meaning                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `ok`          | `value` contains a successful measurement.                                       |
| `warming_up`  | CPU/process utilization requires another valid counter sample.                   |
| `unavailable` | The platform, hardware, or required executable does not provide this capability. |
| `error`       | Collection failed; a serializable error contains a code and message.             |

A failed collector does not remove successful metrics. Snapshots and their values are immutable. `getSnapshot(maxAgeMs)` returns `null` before the first completed cycle; afterward it returns the cached snapshot with `ageMs` and `stale`. Reading a snapshot never refreshes it. The default freshness limit is twice the sampling interval.

## Metric semantics

- `cpu`: utilization from counter differences between two samples, including nice/IRQ time. `usagePercentage` is 0–100% across the measured cores. Counter resets, no elapsed time, unchanged counters, and core topology changes return `warming_up`. Counter fields are milliseconds during the interval.
- `processInfo`: `cpuTimeMs` is cumulative process CPU time; `cpuPercent` is interval utilization relative to one logical core and may exceed 100% for multithreaded work. `memoryBytes` is RSS and `intervalMs` is elapsed sampling time.
- `memory`: `totalMemory`, `freeMemory`, and `usedMemory` are bytes reported by the OS.
- `disk`: asynchronous `statfs` data for each requested path: total, used, free, and available bytes and utilization. A requested path is not a claim to enumerate every mounted volume.
- `network`: interface metadata, not network throughput. `uptime` is seconds; temperature is Celsius; load averages cover 1/5/15 minutes.

Host metrics are labeled `host`, process metrics `process`, disk metrics `filesystem`, and user diagnostics `user`. Container limits are not automatically interpreted as cgroup-aware CPU or memory capacity.

## Express

Install Express separately. The adapter uses structural Node.js HTTP types; importing core metrics does not require Express or its type package.

```ts
import express from "express";
import { createMonitor } from "system-monitoring";
import {
  createMonitorMiddleware,
  createErrorTrackingMiddleware,
  trackRequestResponseTime,
  trackTime,
} from "system-monitoring/express";

const app = express();
const monitor = createMonitor();
await monitor.start();
const errors = createErrorTrackingMiddleware({ maxRoutes: 1000 });
const logging = trackTime({
  filePath: "./logs/requests.jsonl",
  maxQueueSize: 1024,
  maxQueueBytes: 1024 * 1024,
  onError: (error) => console.error(error),
});

app.use(createMonitorMiddleware(monitor));
app.use(errors);
app.use(trackRequestResponseTime());
app.use(logging);
app.get("/health", (req, res) => {
  // Express handlers can use the exported MonitorRequest type when reading
  // systemSnapshot/systemMetrics, or read the monitor directly.
  res.json({ metrics: monitor.getSnapshot(), errors: errors.getStats() });
});

// Invoke these during your application's shutdown sequence:
// await monitor.stop();
// await logging.close();
```

Express 4 and 5 are tested. Middleware reads cached system metrics without running collectors, commands, or filesystem reads on the request path. `req.systemSnapshot` contains typed results; `req.systemMetrics` contains compatible successful values.

`systemMonitor(options, config)` remains available as a convenience factory. Call `await middleware.start()` before mounting it and `await middleware.stop()` during shutdown. Its `responseTime` option installs HTTP timing. Requests before startup get a `null` snapshot and empty legacy metrics.

Error tracking uses response completion, so JSON, object, end, streaming, HEAD, redirects, and 204 responses count once. `totalRequests` counts received requests; `completedRequests` supplies the error-rate denominator. Active and aborted requests are separate. Route buckets use matched templates with method/base URL; unmatched requests share a bucket. There are at most `maxRoutes + 1` buckets; keys over 512 characters use the overflow bucket. `getStats()` and the lazy `req.errorResponse` getter return copies of bounded state.

`X-Response-Time` measures time until headers are committed. `req.responseTime` measures elapsed time until response completion or close. These are different measurements.

## Logging and diagnostics

`trackTime` removes query strings by default. File and database callbacks execute serially on a bounded queue. `storeOnDb` may return a promise; callback/file failures are handled through `onError` and counted in `getStats()`. On overflow, new records are dropped and counted. A slow callback cannot create unlimited pending work. `flush(timeoutMs = 5000)` waits for queued work; `close(timeoutMs)` stops accepting records and flushes. A hung user callback cannot be forcibly cancelled; flush rejects at its deadline, and queued memory remains bounded.

`getLogs(path, keyword?, { maxBytes, maxLines, signal })` reads the bounded tail of a regular file. Defaults are 1 MiB and 1000 lines; maxima are 16 MiB and 10000 lines. Filtering applies to that tail, not the entire file. A partial first line at the byte boundary is omitted. Monitor options accept these limits through `metrics.logs`.

Service queries execute fixed programs with separate arguments, validated names, a timeout, and an output limit. Linux uses systemd when available; Windows uses the Service Control Manager; macOS returns `unknown`. Mounted-volume collection, connections, temperature, and scheduled tasks depend on platform facilities. Missing executables are explicitly unavailable. macOS temperature and Windows load averages are unavailable through the monitor. Log paths and diagnostics are application-controlled; expose sensitive host/user data only through routes your application chooses to authorize.

## Existing function exports

The existing named exports and aliases remain available. `getCpuInfo()` returns cumulative counters and a lifetime utilization ratio; use `createMonitor()` for interval CPU utilization. `getProcessInfo().cpu` retains cumulative milliseconds and has an explicit `cpuTimeMs` alias. `getDiskUsage()` / `getDiskInfo()` are now asynchronous; always await them. Raw diagnostic functions remain usable separately from a monitor.

See [MIGRATION.md](MIGRATION.md) for the 0.1.0 changes and [architecture](docs/architecture.md) for the internal design.

## Development and release

```sh
npm ci
npm run check
npm run docs
npm run benchmark
```

CI checks Node.js 22/24 on Linux, macOS, and Windows. Tests exercise real Express 4/5 responses, CPU sampling, bounded state, async failures, cancellation, and platform parser fixtures. Native disk collection is smoke-tested on the runner OS. Optional OS diagnostics require the appropriate executable/hardware; parser fixtures are not proof of every provider or OS configuration.

Package checks install the built tarball into a clean consumer and verify CommonJS, native ESM, and strict TypeScript without Express types. API documentation builds into `.docs-output`; CI uploads it for review. The committed legacy website is not refreshed or deployed by this change.

Publication is tag-based: merge the reviewed version change to `main`, then push its matching `vX.Y.Z` tag. The release workflow verifies the tag/version and main ancestry, runs the checks, and publishes with the configured `NPM_TOKEN` and provenance. It does not increment versions or push commits. Configure that secret before the first release. The PR alone does not publish to npm.

The benchmark compares an Express baseline with cached system-metrics middleware using repeated, alternating runs. It reports throughput, p50/p95/p99 latency, and event-loop delay. Results depend on hardware, load, and enabled middleware; use the same setup for comparisons. The benchmark does not represent production traffic or the cost of all logging/diagnostic configurations.

MIT licensed.
