import z from "zod";

export const validationSchema = z.object({
  prompt: z.string().min(1),
  context: z.string().min(1),
});