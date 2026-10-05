import { createLogSink } from "../src/sinks/logSink";
import type { LogData } from "../src/types";
const data: LogData = {
  method: "GET",
  url: "/fixture",
  responseTime: "1.000",
  timestamp: "now",
};
it("handles rejected async callbacks and reporting hooks", async () => {
  const report = jest.fn(() => Promise.reject(new Error("report fixture")));
  const sink = createLogSink({
    storeOnDb: async () => {
      throw new Error("sink fixture");
    },
    onError: report,
  });
  sink.enqueue(data);
  await sink.flush();
  expect(sink.getStats()).toMatchObject({ queued: 0, errors: 1 });
  expect(report).toHaveBeenCalledTimes(1);
});
it("bounds queue count and bytes behind a slow sink and supports shutdown", async () => {
  let release!: () => void;
  const sink = createLogSink({
    maxQueueSize: 2,
    maxQueueBytes: 1000,
    storeOnDb: () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  });
  sink.enqueue(data);
  sink.enqueue(data);
  sink.enqueue(data);
  expect(sink.getStats()).toMatchObject({ queued: 2, dropped: 1 });
  await expect(sink.flush(10)).rejects.toThrow("timed out");
  release();
  await new Promise((resolve) => setImmediate(resolve));
  release();
  await sink.close();
  sink.enqueue(data);
  expect(sink.getStats()).toMatchObject({
    queued: 0,
    dropped: 2,
    pendingBytes: 0,
  });
  const tiny = createLogSink({ maxQueueBytes: 1 });
  tiny.enqueue(data);
  expect(tiny.getStats().dropped).toBe(1);
});
