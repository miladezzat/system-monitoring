import type { IncomingMessage, ServerResponse } from "node:http";
import type { MonitorData } from "./types";
import type { Snapshot } from "./core/contracts";

/** Structural HTTP types keep the core package independent of Express types. */
export interface MonitorRequest extends IncomingMessage {
  originalUrl?: string;
  baseUrl?: string;
  route?: { path?: unknown };
  responseTime?: number;
  systemMetrics?: MonitorData;
  systemSnapshot?: Snapshot | null;
}
export type MonitorResponse = ServerResponse;
export type NextFunction = (error?: unknown) => void;
