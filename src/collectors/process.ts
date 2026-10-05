import type { ProcessMetrics } from "../core/contracts";

export function createProcessSampler() {
  let previous: NodeJS.CpuUsage | undefined;
  let previousTime = 0;
  return {
    reset() {
      previous = undefined;
      previousTime = 0;
    },
    sample(): ProcessMetrics | undefined {
      const usage = process.cpuUsage();
      const now = performance.now();
      const before = previous;
      const intervalMs = now - previousTime;
      previous = usage;
      previousTime = now;
      if (
        !before ||
        intervalMs <= 0 ||
        usage.user < before.user ||
        usage.system < before.system
      )
        return undefined;
      return {
        cpuTimeMs: (usage.user + usage.system) / 1000,
        cpuPercent:
          ((usage.user - before.user + usage.system - before.system) /
            1000 /
            intervalMs) *
          100,
        memoryBytes: process.memoryUsage().rss,
        intervalMs,
      };
    },
  };
}
