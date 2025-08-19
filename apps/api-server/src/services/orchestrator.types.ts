import type { stream } from "hono/streaming";

type StreamCallback = Parameters<typeof stream>[1];
export type StreamController = Parameters<StreamCallback>[0];

export interface OrchestratorInput {
  prompt: string;
  deepResearch: boolean;
  stream: StreamController;
  userId: string;
}
