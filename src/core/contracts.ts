import type { CpuInfo, MonitorOptions } from "../types";
import type { NetworkInterfaceInfo } from "node:os";

export interface ProcessMetrics {
  cpuTimeMs: number;
  cpuPercent: number;
  memoryBytes: number;
  intervalMs: number;
}
export interface DiskSpace {
  path: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  availableBytes: number;
  usedPercent: number;
}
export interface MetricValues {
  cpu: CpuInfo & { intervalMs: number };
  memory: { totalMemory: number; freeMemory: number; usedMemory: number };
  disk: DiskSpace[];
  network: NodeJS.Dict<NetworkInterfaceInfo[]>;
  uptime: number;
  processInfo: ProcessMetrics;
  temperature: number;
  osInfo: import("../types").OSInfo;
  loadAverage: import("../types").LoadAverage;
  userInfo: import("../types").ExtendedUserInfo;
  fileSystemInfo: import("../types").FileSystemInfo[] | string;
  activeConnections: import("../types").NetworkConnection[] | string;
  scheduledTasks: import("../types").ScheduledTasksResponse;
  logs: string[];
}
export type MetricName = keyof MetricValues;
export type DeepReadonly<T> = T extends readonly (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type MetricResult<T> = {
  readonly sampledAt: string;
  readonly durationMs: number;
  readonly scope: "host" | "process" | "filesystem" | "user";
} & (
  | { readonly status: "ok"; readonly value: DeepReadonly<T> }
  | { readonly status: "warming_up" | "unavailable"; readonly reason: string }
  | {
      readonly status: "error";
      readonly error: { readonly code: string; readonly message: string };
    }
);
export type SnapshotMetrics = {
  readonly [K in MetricName]?: MetricResult<MetricValues[K]>;
};
export interface Snapshot {
  readonly sampledAt: string;
  readonly ageMs: number;
  readonly stale: boolean;
  readonly metrics: SnapshotMetrics;
}
export interface MonitorConfig {
  metrics?: Omit<MonitorOptions, "responseTime">;
  diskPaths?: readonly string[];
  intervalMs?: number;
  collectorTimeoutMs?: number;
  concurrency?: number;
}
export interface Monitor {
  collect(): Promise<Snapshot>;
  start(): Promise<Snapshot>;
  stop(): Promise<void>;
  getSnapshot(maxAgeMs?: number): Snapshot | null;
}
