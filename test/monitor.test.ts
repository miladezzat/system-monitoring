import { createMonitor } from "../src/core/monitor";
import * as memory from "../src/memoryUsage";
import fs from "node:fs/promises";

const minimal = {
  cpu: false,
  memory: true,
  disk: false,
  network: false,
  uptime: false,
  processInfo: false,
};
afterEach(() => jest.restoreAllMocks());
it("shares in-flight cycles, isolates failures, merges partial defaults and freezes values", async () => {
  const disk = jest
    .spyOn(fs, "statfs")
    .mockRejectedValue(new Error("disk fixture"));
  const monitor = createMonitor({
    metrics: { cpu: false, processInfo: false },
  });
  const first = monitor.collect();
  expect(monitor.collect()).toBe(first);
  const result = await first;
  expect(result.metrics.memory?.status).toBe("ok");
  expect(result.metrics.disk).toMatchObject({
    status: "error",
    error: { message: "disk fixture" },
  });
  expect(result.metrics.network?.status).toBe("ok");
  expect(Object.isFrozen(result.metrics)).toBe(true);
  if (result.metrics.memory?.status === "ok")
    expect(Object.isFrozen(result.metrics.memory.value)).toBe(true);
  expect(disk).toHaveBeenCalled();
  await monitor.stop();
});
it("times out slow collectors without losing successful ones", async () => {
  jest
    .spyOn(memory, "getMemoryUsage")
    .mockImplementation(() => new Promise(() => {}));
  const monitor = createMonitor({
    metrics: { ...minimal, uptime: true },
    collectorTimeoutMs: 10,
  });
  const result = await monitor.collect();
  expect(result.metrics.memory).toMatchObject({
    status: "error",
    error: { code: "TIMEOUT" },
  });
  expect(result.metrics.uptime?.status).toBe("ok");
  await monitor.stop();
});
it("does not start work at construction or import and releases periodic timers", async () => {
  const spy = jest.spyOn(memory, "getMemoryUsage");
  const monitor = createMonitor({ metrics: minimal, intervalMs: 20 });
  expect(spy).not.toHaveBeenCalled();
  expect(monitor.getSnapshot()).toBeNull();
  const start = monitor.start();
  expect(monitor.start()).toBe(start);
  await start;
  await new Promise((resolve) => setTimeout(resolve, 50));
  await monitor.stop();
  const calls = spy.mock.calls.length;
  await new Promise((resolve) => setTimeout(resolve, 40));
  expect(spy).toHaveBeenCalledTimes(calls);
  expect(calls).toBeGreaterThan(1);
  await monitor.start();
  await monitor.stop();
});
it("stop during startup prevents an orphan timer and cancels the cycle", async () => {
  jest
    .spyOn(memory, "getMemoryUsage")
    .mockImplementation(() => new Promise(() => {}));
  const monitor = createMonitor({ metrics: minimal, collectorTimeoutMs: 1000 });
  const started = monitor.start();
  await new Promise((resolve) => setImmediate(resolve));
  await monitor.stop();
  await started;
  expect(monitor.getSnapshot()).toBeNull();
});
it("validates config before IO", () => {
  expect(() => createMonitor({ intervalMs: 0 })).toThrow();
  expect(() => createMonitor({ concurrency: 100 })).toThrow();
  expect(() => createMonitor({ diskPaths: [] })).toThrow();
  expect(() =>
    createMonitor({ metrics: { cpu: "yes" as unknown as boolean } }),
  ).toThrow();
});
it("collects native disk paths on the current platform", async () => {
  const monitor = createMonitor({
    metrics: { ...minimal, memory: false, disk: true },
    diskPaths: [process.cwd()],
  });
  const result = await monitor.collect();
  expect(result.metrics.disk?.status).toBe("ok");
  if (result.metrics.disk?.status === "ok")
    expect(result.metrics.disk.value[0].totalBytes).toBeGreaterThan(0);
  await monitor.stop();
});

it("does not launch another uncancellable collector while timed-out work remains pending", async () => {
  const read = jest
    .spyOn(memory, "getMemoryUsage")
    .mockImplementation(() => new Promise(() => {}));
  const monitor = createMonitor({ metrics: minimal, collectorTimeoutMs: 10 });
  await monitor.collect();
  expect((await monitor.collect()).metrics.memory).toMatchObject({
    status: "error",
    error: { code: "COLLECTOR_BUSY" },
  });
  const { stop, start } = monitor;
  await stop();
  await start();
  await stop();
  expect(read).toHaveBeenCalledTimes(1);
});

it("ignores undefined partial options but rejects unknown configuration keys", async () => {
  const monitor = createMonitor({ metrics: { ...minimal, memory: undefined } });
  expect((await monitor.collect()).metrics.memory?.status).toBe("ok");
  await monitor.stop();
  expect(() =>
    createMonitor({
      metrics: {
        toString: true,
      } as unknown as import("../src/types").MonitorOptions,
    }),
  ).toThrow("Unknown metric");
});
