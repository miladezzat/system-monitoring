import { EventEmitter } from "node:events";
import { createErrorTrackingMiddleware } from "../src/errorTrackingMiddleware";
import type { TrackingCustomErrorRequest } from "../src/types";
import type { MonitorResponse } from "../src/httpTypes";

function response(statusCode = 200) {
  return Object.assign(new EventEmitter(), {
    statusCode,
    writableFinished: false,
  }) as unknown as MonitorResponse;
}
function request(path = "/users/:id") {
  return {
    method: "GET",
    route: { path },
    originalUrl: "/users/123?secret=value",
  } as TrackingCustomErrorRequest;
}
it("exposes live stats before sending and counts finish once", () => {
  const tracker = createErrorTrackingMiddleware();
  const req = request();
  const res = response(500);
  tracker(req, res, () => {});
  expect(req.errorResponse).toMatchObject({
    totalRequests: 1,
    activeRequests: 1,
    errorCount: 0,
  });
  res.emit("finish");
  res.emit("finish");
  res.emit("close");
  expect(tracker.getStats()).toMatchObject({
    completedRequests: 1,
    activeRequests: 0,
    errorCount: 1,
    errorRate: "100.00%",
    errorRoutes: { "GET /users/:id": 1 },
  });
});
it("uses completed responses as denominator and separates aborts", () => {
  const tracker = createErrorTrackingMiddleware();
  const completed = response(500),
    active = response(),
    aborted = response();
  for (const res of [completed, active, aborted])
    tracker(request(), res, () => {});
  completed.emit("finish");
  aborted.emit("close");
  expect(tracker.getStats()).toMatchObject({
    totalRequests: 3,
    completedRequests: 1,
    activeRequests: 1,
    abortedRequests: 1,
    errorRate: "100.00%",
  });
  active.emit("finish");
  expect(tracker.getStats().errorRate).toBe("50.00%");
});
it("bounds matched routes and groups unmatched query variants", () => {
  const tracker = createErrorTrackingMiddleware({ maxRoutes: 2 });
  for (let i = 0; i < 2000; i++) {
    const req = request(`/route-${i}`);
    const res = response(404);
    tracker(req, res, () => {});
    res.emit("finish");
  }
  expect(Object.keys(tracker.getStats().errorRoutes)).toHaveLength(3);
  const unmatched = createErrorTrackingMiddleware();
  for (let i = 0; i < 2000; i++) {
    const req = {
      method: "GET",
      originalUrl: `/missing?nonce=${i}`,
    } as TrackingCustomErrorRequest;
    const res = response(404);
    unmatched(req, res, () => {});
    res.emit("finish");
  }
  expect(unmatched.getStats().errorRoutes).toEqual({ __unmatched__: 2000 });
});
it("does not retain unbounded route keys or share caller-mutated stats", () => {
  const tracker = createErrorTrackingMiddleware({ maxRoutes: 1 });
  const res = response(404);
  tracker(request("x".repeat(10000)), res, () => {});
  res.emit("finish");
  const stats = tracker.getStats();
  stats.errorRoutes.__other__ = 99;
  expect(tracker.getStats().errorRoutes.__other__).toBe(1);
});
it("validates state limits", () => {
  expect(() => createErrorTrackingMiddleware({ maxRoutes: 0 })).toThrow(
    RangeError,
  );
});
