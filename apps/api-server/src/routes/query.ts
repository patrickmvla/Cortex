import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { stream } from 'hono/streaming';
import { orchestrator } from '../services/orchestrator';

const query = new Hono();

const querySchema = z.object({
  prompt: z.string().min(1),
  deepResearch: z.boolean().default(false),
});

query.post('/', zValidator('json', querySchema), async (c) => {
  const { prompt, deepResearch } = c.req.valid('json');

  return stream(c, async (stream) => {
    await orchestrator.run({
      prompt,
      deepResearch,
      stream,
    });
  });
});

export default query;
