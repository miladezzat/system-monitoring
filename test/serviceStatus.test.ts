import { getServiceStatus } from "../src/serviceStatus";
import { runCommand } from "../src/platforms/command";
jest.mock("../src/platforms/command");
const command = jest.mocked(runCommand);
const descriptor = Object.getOwnPropertyDescriptor(process, "platform")!;
afterEach(() => {
  Object.defineProperty(process, "platform", descriptor);
  jest.clearAllMocks();
});
it("maps Linux inactive and missing-service results without shell execution", async () => {
  Object.defineProperty(process, "platform", { value: "linux" });
  command.mockResolvedValue({ stdout: "inactive\n", stderr: "", exitCode: 3 });
  expect(await getServiceStatus("example.service")).toBe("inactive");
  expect(command).toHaveBeenCalledWith(
    "systemctl",
    ["is-active", "--", "example.service"],
    { acceptedExitCodes: [3, 4] },
  );
  command.mockResolvedValue({ stdout: "unknown\n", stderr: "", exitCode: 4 });
  expect(await getServiceStatus("example.service")).toBe("unknown");
});
it("queries Windows names as a single argument and reports absent services", async () => {
  Object.defineProperty(process, "platform", { value: "win32" });
  command.mockResolvedValue({
    stdout: "STATE : 4 RUNNING",
    stderr: "",
    exitCode: 0,
  });
  expect(await getServiceStatus("Example service")).toBe("running");
  expect(command).toHaveBeenCalledWith("sc.exe", ["query", "Example service"], {
    acceptedExitCodes: [1060],
  });
  command.mockResolvedValue({ stdout: "", stderr: "", exitCode: 1060 });
  expect(await getServiceStatus("missing")).toBe("unknown");
});
it("does not invoke systemd on macOS", async () => {
  Object.defineProperty(process, "platform", { value: "darwin" });
  expect(await getServiceStatus("example")).toBe("unknown");
  expect(command).not.toHaveBeenCalled();
});
