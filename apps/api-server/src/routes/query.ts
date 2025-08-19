// apps/api-server/src/routes/query.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { stream } from "hono/streaming";
import { orchestrator } from "../services/orchestrator";
import { authMiddleware } from "../middleware/auth";
import { querySchema } from "../schemas/query.schema";

const routes = new Hono()
  .post("/", authMiddleware, zValidator("json", querySchema), async (c) => {
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

export default routes;