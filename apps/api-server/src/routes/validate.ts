import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { fireworks } from '@ai-sdk/fireworks';
import { streamText as honoStreamText } from 'hono/streaming';
import { streamText } from 'ai';

const validate = new Hono();

const validationSchema = z.object({
  prompt: z.string().min(1),
  context: z.string().min(1),
});

const synthesisSystemPrompt = `
You are an expert AI assistant. Your job is to synthesize a comprehensive, grounded, and cited answer based on the user's prompt and the provided context.
- Use ONLY the provided context to answer the user's prompt.
- Do not make up information. If the context does not provide an answer, state that.
- This is a validation step, so be concise and stick to the facts presented in the context.
`;

validate.post('/', zValidator('json', validationSchema), async (c) => {
  const { prompt, context } = c.req.valid('json');

  const { textStream } = await streamText({
    model: fireworks('accounts/fireworks/models/firefunction-v2'),
    system: synthesisSystemPrompt,
    prompt: `Prompt: ${prompt}\n\nContext:\n${context}`,
  });

  return honoStreamText(c, async (stream) => {
    for await (const text of textStream) {
      stream.write(text);
    }
  });
});

export default validate;
