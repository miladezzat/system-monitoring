import type {
  MonitorRequest,
  MonitorResponse,
  NextFunction,
} from "./httpTypes";
import type { TrackTimeOptions } from "./types";
import { createLogSink } from "./sinks/logSink";

/** Bounded, serial async logging. Query strings are excluded by default. */
export function trackTime(options: TrackTimeOptions = {}) {
  const sink = createLogSink(options);
  const middleware = (
    req: MonitorRequest,
    res: MonitorResponse,
    next: NextFunction,
  ): void => {
    const start = process.hrtime.bigint();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      res.off("finish", finish);
      res.off("close", finish);
      sink.enqueue({
        method: req.method ?? "UNKNOWN",
        url: (req.originalUrl ?? req.url ?? "/").split("?")[0],
        responseTime: (Number(process.hrtime.bigint() - start) / 1e6).toFixed(
          3,
        ),
        timestamp: new Date().toISOString(),
      });
    };
    res.once("finish", finish);
    res.once("close", finish);
    next();
  };
  return Object.assign(middleware, {
    flush: sink.flush,
    close: sink.close,
    getStats: sink.getStats,
  });
}
export default trackTime;
