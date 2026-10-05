const http = require("node:http");
const os = require("node:os");
const { performance, monitorEventLoopDelay } = require("node:perf_hooks");
const express = require("express");
const { createMonitor, createMonitorMiddleware } = require("../dist");
const count = Number(process.env.BENCH_REQUESTS || 3000);
const concurrency = Number(process.env.BENCH_CONCURRENCY || 20);
const rounds = Number(process.env.BENCH_ROUNDS || 3);
if (![count, concurrency, rounds].every((n) => Number.isInteger(n) && n > 0))
  throw new Error("Benchmark inputs must be positive integers");
const percentile = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
async function measure(enabled) {
  const app = express();
  const monitor = createMonitor({ intervalMs: 1000 });
  if (enabled) {
    await monitor.start();
    app.use(createMonitorMiddleware(monitor));
  }
  app.get("/test", (_req, res) => res.end("ok"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });
  const port = server.address().port;
  const request = () =>
    new Promise((resolve, reject) => {
      const started = performance.now();
      const req = http.get(
        { host: "127.0.0.1", port, path: "/test", agent },
        (res) => {
          res.resume();
          res.once("end", () => resolve(performance.now() - started));
        },
      );
      req.once("error", reject);
    });
  const latencies = [];
  const work = async (n, record) => {
    let next = 0;
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (next++ < n) {
          const elapsed = await request();
          if (record) latencies.push(elapsed);
        }
      }),
    );
  };
  try {
    await work(500, false);
    const delay = monitorEventLoopDelay({ resolution: 10 });
    delay.enable();
    const start = performance.now();
    await work(count, true);
    const durationMs = performance.now() - start;
    delay.disable();
    latencies.sort((a, b) => a - b);
    return {
      requestsPerSecond: count / (durationMs / 1000),
      p50Ms: percentile(latencies, 0.5),
      p95Ms: percentile(latencies, 0.95),
      p99Ms: percentile(latencies, 0.99),
      eventLoopP99Ms: delay.percentile(99) / 1e6,
    };
  } finally {
    agent.destroy();
    await new Promise((resolve) => server.close(resolve));
    await monitor.stop();
  }
}
(async () => {
  const baseline = [],
    monitoring = [];
  for (let round = 0; round < rounds; round++) {
    const order = round % 2 ? [true, false] : [false, true];
    for (const enabled of order)
      (enabled ? monitoring : baseline).push(await measure(enabled));
  }
  const median = (values) => {
    const sorted = [...values].sort(
      (a, b) => a.requestsPerSecond - b.requestsPerSecond,
    );
    return sorted[Math.floor(sorted.length / 2)];
  };
  const base = median(baseline),
    monitored = median(monitoring);
  console.log(
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuModel: os.cpus()[0]?.model,
        logicalCores: os.cpus().length,
        totalMemoryBytes: os.totalmem(),
        requestsPerRound: count,
        concurrency,
        rounds,
        scope: "cached system metrics adapter",
        baseline: base,
        monitoring: monitored,
        throughputRegressionPercent:
          (1 - monitored.requestsPerSecond / base.requestsPerSecond) * 100,
      },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
