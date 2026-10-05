import os from "node:os";
import type { CpuInfo } from "../types";

const total = (t: os.CpuInfo["times"]) =>
  t.user + t.sys + t.idle + t.nice + t.irq;
export function createCpuSampler() {
  let previous: os.CpuInfo[] | undefined;
  let previousTime = 0;
  return {
    reset() {
      previous = undefined;
      previousTime = 0;
    },
    sample(): (CpuInfo & { intervalMs: number }) | undefined {
      const current = os.cpus();
      const now = performance.now();
      const before = previous;
      const intervalMs = now - previousTime;
      previous = current;
      previousTime = now;
      if (
        !before ||
        !current.length ||
        before.length !== current.length ||
        intervalMs <= 0
      )
        return undefined;
      const coreDetails = current.map((cpu, coreId) => {
        const old = before[coreId].times;
        const times = cpu.times;
        if (
          cpu.model !== before[coreId].model ||
          Object.keys(times).some(
            (k) => times[k as keyof typeof times] < old[k as keyof typeof old],
          )
        )
          return undefined;
        const totalTime = total(times) - total(old);
        if (totalTime <= 0) return undefined;
        const idleTime = times.idle - old.idle;
        return {
          coreId,
          userTime: times.user - old.user,
          systemTime: times.sys - old.sys,
          idleTime,
          totalTime,
          usagePercentage: ((totalTime - idleTime) / totalTime) * 100,
        };
      });
      if (coreDetails.some((c) => c === undefined)) return undefined;
      const cores = coreDetails as CpuInfo["coreDetails"];
      const totalTime = cores.reduce((n, c) => n + c.totalTime, 0);
      const idleTime = cores.reduce((n, c) => n + c.idleTime, 0);
      return {
        totalUserTime: cores.reduce((n, c) => n + c.userTime, 0),
        totalSystemTime: cores.reduce((n, c) => n + c.systemTime, 0),
        totalIdleTime: idleTime,
        totalTime,
        usedTime: totalTime - idleTime,
        idleTime,
        usagePercentage: ((totalTime - idleTime) / totalTime) * 100,
        coreDetails: cores,
        intervalMs,
      };
    },
  };
}
