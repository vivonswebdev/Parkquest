import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email(),
  locale: z.string().max(10),
});
export type SignInInput = z.infer<typeof signInSchema>;
