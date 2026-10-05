import type {
  MonitorRequest,
  MonitorResponse,
  NextFunction,
} from "./httpTypes";

/** Header measures time to commit headers; req.responseTime measures total duration. */
export const trackRequestResponseTime =
  () =>
  (req: MonitorRequest, res: MonitorResponse, next: NextFunction): void => {
    const start = process.hrtime.bigint();
    const elapsed = () => Number(process.hrtime.bigint() - start) / 1e6;
    const original = res.writeHead;
    res.writeHead = function (
      this: MonitorResponse,
      ...args: [number, ...unknown[]]
    ) {
      if (!this.headersSent && !this.hasHeader("X-Response-Time"))
        this.setHeader("X-Response-Time", `${elapsed().toFixed(3)}ms`);
      return Reflect.apply(original, this, args);
    } as typeof res.writeHead;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      req.responseTime = elapsed();
      res.off("finish", finish);
      res.off("close", finish);
    };
    res.once("finish", finish);
    res.once("close", finish);
    next();
  };
export default trackRequestResponseTime;
