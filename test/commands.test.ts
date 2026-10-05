import { runCommand } from "../src/platforms/command";
import { getServiceStatus } from "../src/serviceStatus";

it("keeps shell metacharacters literal in arguments", async () => {
  const value = "service; printf INERT_MARKER";
  const result = await runCommand(process.execPath, [
    "-e",
    "process.stdout.write(process.argv[1])",
    value,
  ]);
  expect(result.stdout).toBe(value);
});
it("rejects service shell syntax and leading options before execution", async () => {
  for (const name of [
    "service; printf marker",
    "$(printf marker)",
    "--help",
    "bad\nname",
  ])
    await expect(getServiceStatus(name)).rejects.toThrow(
      "Invalid service name",
    );
});
it("bounds process duration and buffered output", async () => {
  await expect(
    runCommand(process.execPath, ["-e", "setInterval(()=>{},1000)"], {
      timeoutMs: 50,
    }),
  ).rejects.toMatchObject({ killed: true });
  await expect(
    runCommand(
      process.execPath,
      ["-e", "process.stdout.write('x'.repeat(20000))"],
      { maxBuffer: 128 },
    ),
  ).rejects.toMatchObject({ code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" });
});
it("cancels commands and distinguishes missing capabilities", async () => {
  const abort = new AbortController();
  abort.abort();
  await expect(
    runCommand(process.execPath, ["-e", "setInterval(()=>{},1000)"], {
      signal: abort.signal,
    }),
  ).rejects.toThrow();
  await expect(
    runCommand("system-monitoring-fixture-does-not-exist", []),
  ).rejects.toMatchObject({ code: "UNAVAILABLE" });
});
it("accepts expected nonzero service exit codes with stdout", async () => {
  const result = await runCommand(
    process.execPath,
    ["-e", "process.stdout.write('inactive');process.exitCode=3"],
    { acceptedExitCodes: [3] },
  );
  expect(result).toMatchObject({ stdout: "inactive", exitCode: 3 });
});
