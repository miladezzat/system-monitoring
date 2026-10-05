# Migrating from 0.0.17 to 0.1.0

0.1.0 changes request lifecycle and disk API behavior. Review these changes before upgrading.

1. Node.js 22 or newer is required. Use Node.js 22 or 24 for the tested LTS matrix.
2. `getDiskUsage()` / `getDiskInfo()` return promises. Replace synchronous calls with `await getDiskUsage()`.
3. `systemMonitor()` has an explicit lifecycle. Create it, await `.start()`, then mount it; await `.stop()` at shutdown. Collection is cached and never triggered by a request. Partial options merge with defaults. Disable unwanted default metrics explicitly.
4. CPU sampling in `createMonitor()` uses counter deltas. CPU and process metrics are `warming_up` until two valid samples exist. Do not treat unavailable/warming metrics as zero. The older standalone `getCpuInfo()` remains a cumulative/lifetime reading.
5. `getProcessInfo().cpu` is cumulative milliseconds, as in 0.0.17; `cpuTimeMs` makes this explicit. For utilization, use snapshot `processInfo.cpuPercent`, relative to one core. `req.systemMetrics.processInfo.cpu` also remains cumulative milliseconds.
6. Snapshot disk metrics describe requested paths, not all mounted filesystems. Legacy middleware `diskUsage` maps those path readings to the old field names; `mountPoint`/`filesystem` hold the requested path. Use async `getDiskUsage()` when mounted-volume enumeration is required.
7. Error statistics are available before send through a getter and update at response finish/abort. Error rate uses completed responses. Read final statistics with `tracker.getStats()`. Error-route keys use method and matched route template, with bounded unmatched/overflow buckets; raw URLs and query strings no longer become persistent keys.
8. `X-Response-Time` describes time until header commitment. `req.responseTime` is completion/close duration. The system middleware's `responseTime` option is now implemented at the HTTP boundary.
9. Log reads return a bounded tail rather than an entire file. Logging removes query strings, bounds its queue, observes returned callback promises, and exposes `.flush()`, `.close()`, and `.getStats()`. New records are dropped on queue overflow.
10. Use `system-monitoring/express` for middleware. Existing root exports and aliases are retained for compatibility. Use the documented root and `./express` entry points; the export map no longer permits arbitrary `dist/` deep imports. Public HTTP types are structural and do not import Express types.
11. Service names containing shell syntax or leading options are rejected. Linux inactive service exit codes return `inactive`; unsupported service managers return `unknown`. Diagnostics use asynchronous, shell-free commands and may return unavailable/errors where older functions silently returned misleading values.

## Before

```ts
app.use(systemMonitor({ cpu: true, memory: true }));
const disks = getDiskUsage();
```

## After

```ts
const metrics = systemMonitor({ cpu: true, memory: true, disk: false });
await metrics.start();
app.use(metrics);
const disks = await getDiskUsage();
// At shutdown: await metrics.stop();
```

Applications own authorization for diagnostic endpoints, sampling lifecycle, and logging destinations. No exporter, server, database connection, or background timer starts on import.
