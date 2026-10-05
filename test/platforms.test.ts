import { parseDiskUsage, parseWindowsDiskOutput } from "../src/diskUsage";
import { parseNetstatOutput } from "../src/activeConnections";
import { parseScheduledTasks } from "../src/scheduledTasks";
import { getLogs } from "../src/logs";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

it("parses Linux and BSD volumes including inode columns and spaced mounts", () => {
  const linux =
    "Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/sda1 1000 400 600 40% /data with spaces\n";
  const bsd =
    "Filesystem 1024-blocks Used Available Capacity iused ifree %iused Mounted on\n/dev/disk3 1000 400 600 40% 20 980 2% /\n";
  expect(parseDiskUsage(linux)[0]).toMatchObject({
    total: 1024000,
    mountPoint: "/data with spaces",
  });
  expect(parseDiskUsage(bsd)[0].mountPoint).toBe("/");
  expect(() => parseDiskUsage("header\n/dev/x bad bad bad 4% /\n")).toThrow();
});
it("parses Windows numeric disk JSON and ignores empty removable media", () => {
  expect(
    parseWindowsDiskOutput(
      '[{"DeviceID":"C:","Size":1000,"FreeSpace":600},{"DeviceID":"D:","Size":null,"FreeSpace":null}]',
    ),
  ).toEqual([
    {
      filesystem: "C:",
      mountPoint: "C:",
      total: 1000,
      available: 600,
      used: 400,
      usedPercentage: 40,
    },
  ]);
});
it("parses TCP connections by platform layout and ignores blank/footer rows", () => {
  const unix =
    "Proto Recv-Q Send-Q Local Address Foreign Address State\ntcp 0 0 127.0.0.1:80 127.0.0.2:3000 ESTABLISHED\n\n";
  const windows =
    "Proto Local Address Foreign Address State\n TCP 127.0.0.1:80 127.0.0.2:3000 ESTABLISHED\n";
  expect(parseNetstatOutput(unix, "linux")[0].localAddress).toBe(
    "127.0.0.1:80",
  );
  expect(parseNetstatOutput(unix, "darwin")[0].state).toBe("ESTABLISHED");
  expect(parseNetstatOutput(windows, "win32")[0].foreignAddress).toBe(
    "127.0.0.2:3000",
  );
});
it("ignores cron environment/comments and handles quoted Windows CSV", () => {
  expect(
    parseScheduledTasks(
      "# comment\nPATH=/bin\n* * * * * echo ready\n",
      "linux",
    ),
  ).toEqual([{ name: "Cron Job", details: "* * * * * echo ready" }]);
  expect(
    parseScheduledTasks('"Task, one","today","Ready"\n', "win32")[0].name,
  ).toBe("Task, one");
});
it("reads bounded log tails, filters them, and closes resources after cancellation", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "monitor-logs-"));
  try {
    const file = path.join(root, "test.log");
    await writeFile(file, "prefix that is truncated\nfirst\nERROR last\n");
    expect(await getLogs(file, "ERROR", { maxBytes: 22, maxLines: 2 })).toEqual(
      ["ERROR last"],
    );
    const abort = new AbortController();
    abort.abort();
    await expect(
      getLogs(file, undefined, { signal: abort.signal }),
    ).rejects.toThrow();
    await expect(getLogs(root)).rejects.toThrow();
    await expect(getLogs(file, undefined, { maxBytes: 0 })).rejects.toThrow(
      RangeError,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
