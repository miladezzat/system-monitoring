import express from "express";
import {
  systemMonitor,
  createErrorTrackingMiddleware,
  trackTime,
} from "../src/express";

async function main() {
  const app = express();
  const metrics = systemMonitor();
  const errors = createErrorTrackingMiddleware();
  const logger = trackTime({ filePath: "./logs/requests.jsonl" });
  await metrics.start();
  app.use(metrics, errors, logger);
  app.get("/", (_req, res) =>
    res.json({ snapshot: metrics.getSnapshot(), errors: errors.getStats() }),
  );
  const server = app.listen(3000);
  process.once("SIGTERM", () => {
    server.close(() => {
      void Promise.all([metrics.stop(), logger.close()]);
    });
  });
}
void main();
