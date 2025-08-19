import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { stream } from "hono/streaming";
import { orchestrator } from "../services/orchestrator";
import { authMiddleware } from "../middleware/auth";

const query = new Hono();

export const querySchema = z.object({
  prompt: z.string().min(1),
  deepResearch: z.boolean().default(false),
});

query.post("/", authMiddleware, zValidator("json", querySchema), async (c) => {
  const { prompt, deepResearch } = c.req.valid("json");
  const userId = c.var.userId;

  return stream(c, async (stream) => {
    await orchestrator.run({
      prompt,
      deepResearch,
      stream,
      userId,
    });
  });
});

export default query;
