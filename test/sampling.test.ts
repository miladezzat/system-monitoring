import os from "node:os";
import { createCpuSampler } from "../src/collectors/cpu";
import { createProcessSampler } from "../src/collectors/process";

function core(user: number, idle: number, nice = 0, irq = 0): os.CpuInfo {
  return {
    model: "fixture",
    speed: 1000,
    times: { user, sys: 0, idle, nice, irq },
  };
}
afterEach(() => jest.restoreAllMocks());
it("measures CPU counter deltas including nice and irq", () => {
  const clock = jest.spyOn(performance, "now").mockReturnValue(100);
  const cpus = jest.spyOn(os, "cpus").mockReturnValue([core(1000, 9000)]);
  const sample = createCpuSampler();
  expect(sample.sample()).toBeUndefined();
  clock.mockReturnValue(200);
  cpus.mockReturnValue([core(1100, 9000, 25, 25)]);
  expect(sample.sample()).toMatchObject({
    usagePercentage: 100,
    totalTime: 150,
    usedTime: 150,
    intervalMs: 100,
  });
  clock.mockReturnValue(300);
  cpus.mockReturnValue([core(1100, 9100, 25, 25)]);
  expect(sample.sample()?.usagePercentage).toBe(0);
});
it("warms up for zero deltas, resets, core changes and independent instances", () => {
  const clock = jest.spyOn(performance, "now").mockReturnValue(100);
  const cpus = jest.spyOn(os, "cpus").mockReturnValue([core(100, 100)]);
  const first = createCpuSampler(),
    second = createCpuSampler();
  first.sample();
  clock.mockReturnValue(200);
  expect(first.sample()).toBeUndefined();
  cpus.mockReturnValue([core(200, 100)]);
  clock.mockReturnValue(300);
  expect(first.sample()?.usagePercentage).toBe(100);
  expect(second.sample()).toBeUndefined();
  cpus.mockReturnValue([core(1, 1)]);
  clock.mockReturnValue(400);
  expect(first.sample()).toBeUndefined();
  cpus.mockReturnValue([core(20, 20), core(20, 20)]);
  clock.mockReturnValue(500);
  expect(first.sample()).toBeUndefined();
});
it("separates process CPU milliseconds from one-core interval percent", () => {
  const clock = jest.spyOn(performance, "now").mockReturnValue(100);
  const usage = jest
    .spyOn(process, "cpuUsage")
    .mockReturnValue({ user: 100000, system: 0 });
  const sample = createProcessSampler();
  expect(sample.sample()).toBeUndefined();
  clock.mockReturnValue(200);
  usage.mockReturnValue({ user: 250000, system: 50000 });
  expect(sample.sample()).toMatchObject({
    cpuTimeMs: 300,
    cpuPercent: 200,
    intervalMs: 100,
  });
});
