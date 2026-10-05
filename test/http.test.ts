import express from "express";
import type { AddressInfo } from "node:net";
import http from "node:http";
import { Readable } from "node:stream";
import { createErrorTrackingMiddleware } from "../src/errorTrackingMiddleware";
import { trackRequestResponseTime } from "../src/trackRequestResponseTime";
import { trackTime } from "../src/trackTime";
import type { MonitorRequest } from "../src/httpTypes";
import { createMonitor, systemMonitor } from "../src";

// The same real HTTP scenarios run against Express 4 and 5.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Use the same structural HTTP contract for both Express versions.
const express5: typeof express = require("express5");
for (const [version, factory] of [
  ["4", express],
  ["5", express5],
] as const) {
  describe(`Express ${version}`, () => {
    let server: http.Server;
    let port: number;
    const tracker = createErrorTrackingMiddleware();
    const logger = trackTime({
      storeOnDb: async () => {
        throw new Error("sink fixture");
      },
    });
    beforeAll(async () => {
      const app = factory();
      app.use(trackRequestResponseTime(), tracker, logger);
      app.get("/object", (_req, res) => {
        res.status(500).send({ error: "fixture" });
      });
      app.get("/json", (_req, res) => {
        res.status(400).json({ error: "fixture" });
      });
      app.get("/end", (_req, res) => {
        res.status(503).end();
      });
      app.get("/empty", (_req, res) => {
        res.status(204).end();
      });
      app.get("/redirect", (_req, res) => {
        res.redirect("/empty");
      });
      app.get("/stream", (_req, res) => {
        Readable.from(["hello", "world"]).pipe(res);
      });
      app.get("/abort", (_req, res) => {
        res.write("start");
      });
      server = app.listen(0, "127.0.0.1");
      await new Promise<void>((resolve, reject) =>
        server.once("listening", resolve).once("error", reject),
      );
      port = (server.address() as AddressInfo).port;
    });
    afterAll(async () => {
      await logger.close();
      if (server.listening)
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
    });
    const fetch = (path: string, method = "GET") =>
      new Promise<{
        status: number;
        header: string | string[] | undefined;
        body: string;
      }>((resolve, reject) => {
        const request = http.request(
          { host: "127.0.0.1", port, path, method, agent: false },
          (res) => {
            let body = "";
            res.on("data", (chunk) => {
              body += chunk;
            });
            res.on("end", () =>
              resolve({
                status: res.statusCode!,
                header: res.headers["x-response-time"],
                body,
              }),
            );
          },
        );
        request.on("error", reject);
        request.end();
      });
    it("counts JSON, object, end, HEAD, redirects and streaming once", async () => {
      for (const [path, method] of [
        ["/object", "GET"],
        ["/json", "GET"],
        ["/end", "GET"],
        ["/empty", "GET"],
        ["/redirect", "GET"],
        ["/stream", "GET"],
        ["/object", "HEAD"],
      ]) {
        const before = tracker.getStats();
        const response = await fetch(path, method);
        expect(response.header).toMatch(/^\d+\.\d{3}ms$/);
        const stats = tracker.getStats();
        expect(stats.completedRequests - before.completedRequests).toBe(1);
        expect(stats.errorCount - before.errorCount).toBe(
          response.status >= 400 ? 1 : 0,
        );
        expect(parseFloat(stats.errorRate)).toBeLessThanOrEqual(100);
      }
      await logger.flush();
      expect(logger.getStats().errors).toBe(7);
    });
    it("records a client abort once", async () => {
      const before = tracker.getStats().abortedRequests;
      const closed = new Promise<void>((resolve) =>
        server.once("request", (_req, res) => res.once("close", resolve)),
      );
      await new Promise<void>((resolve, reject) => {
        const request = http.get(
          { host: "127.0.0.1", port, path: "/abort", agent: false },
          (res) => {
            res.once("data", () => {
              request.destroy();
              resolve();
            });
          },
        );
        request.once("error", reject);
      });
      await closed;
      expect(tracker.getStats().abortedRequests).toBe(before + 1);
    });
  });
}
it("reads a cached snapshot without starting collection on requests", async () => {
  const middleware = systemMonitor({
    cpu: false,
    memory: true,
    disk: false,
    network: false,
    uptime: false,
    processInfo: false,
  });
  const req = {} as MonitorRequest;
  const next = jest.fn();
  middleware(req, {} as http.ServerResponse, next);
  expect(req.systemSnapshot).toBeNull();
  await middleware.start();
  const spy = jest.spyOn(process, "cpuUsage");
  for (let i = 0; i < 1000; i++)
    middleware(req, {} as http.ServerResponse, next);
  expect(req.systemMetrics?.memoryUsage?.totalMemory).toBeGreaterThan(0);
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
  await middleware.stop();
});
it("retains snapshots after stop and marks old data stale", async () => {
  const monitor = createMonitor({
    metrics: { cpu: false, processInfo: false, disk: false },
  });
  await monitor.collect();
  await monitor.stop();
  expect(monitor.getSnapshot(0)?.stale).toBe(true);
});
