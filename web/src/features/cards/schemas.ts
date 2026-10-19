import { z } from "zod";

export const cardSchema = z.object({
  front: z.string().trim().min(1, "frontRequired"),
  back: z.string().trim().min(1, "backRequired"),
});

export type CardFormValues = z.infer<typeof cardSchema>;
