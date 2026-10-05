import type { MonitorResponse, NextFunction } from "./httpTypes";
import type { TrackingCustomErrorRequest } from "./types";

export interface ErrorTrackingOptions {
  maxRoutes?: number;
}
export function createErrorTrackingMiddleware(
  options: ErrorTrackingOptions = {},
) {
  const maxRoutes = options.maxRoutes ?? 1000;
  if (!Number.isInteger(maxRoutes) || maxRoutes < 1 || maxRoutes > 10000)
    throw new RangeError("maxRoutes must be an integer between 1 and 10000");
  let totalRequests = 0,
    completedRequests = 0,
    abortedRequests = 0,
    activeRequests = 0,
    errorCount = 0;
  const routes = new Map<string, number>();
  const getStats = () => ({
    totalRequests,
    completedRequests,
    activeRequests,
    abortedRequests,
    errorCount,
    errorRate: `${(completedRequests ? (errorCount / completedRequests) * 100 : 0).toFixed(2)}%`,
    errorRoutes: Object.fromEntries(routes),
  });
  const middleware = (
    req: TrackingCustomErrorRequest,
    res: MonitorResponse,
    next: NextFunction,
  ): void => {
    totalRequests++;
    activeRequests++;
    Object.defineProperty(req, "errorResponse", {
      configurable: true,
      get: getStats,
    });
    let settled = false;
    const settle = (completed: boolean) => {
      if (settled) return;
      settled = true;
      res.off("finish", finish);
      res.off("close", close);
      activeRequests--;
      if (!completed) {
        abortedRequests++;
        return;
      }
      completedRequests++;
      if (res.statusCode < 400) return;
      errorCount++;
      const template = req.route?.path;
      let key =
        typeof template === "string"
          ? `${req.method ?? "UNKNOWN"} ${req.baseUrl ?? ""}${template}`
          : "__unmatched__";
      if (key.length > 512 || (!routes.has(key) && routes.size >= maxRoutes))
        key = "__other__";
      routes.set(key, (routes.get(key) ?? 0) + 1);
    };
    const finish = () => settle(true);
    const close = () => settle(res.writableFinished);
    res.once("finish", finish);
    res.once("close", close);
    next();
  };
  return Object.assign(middleware, { getStats });
}
export default createErrorTrackingMiddleware;
