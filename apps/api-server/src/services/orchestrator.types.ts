import type { stream } from "hono/streaming";

// Infer the correct type for the stream controller from the Hono helper
type StreamCallback = Parameters<typeof stream>[1];
export type StreamController = Parameters<StreamCallback>[0];

export interface OrchestratorInput {
  prompt: string;
  deepResearch: boolean;
  stream: StreamController;
  userId: string;
}
