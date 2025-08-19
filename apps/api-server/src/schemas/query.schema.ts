import z from "zod";

export const querySchema = z.object({
  prompt: z.string().min(1),
  deepResearch: z.boolean().default(false),
});