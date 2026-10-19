import { z } from "zod";

// As mensagens são chaves de tradução: a tela as resolve com `t(...)`.
export const groupSchema = z.object({
  name: z.string().trim().min(1, "groupNameRequired"),
});

export const deckSchema = z.object({
  name: z.string().trim().min(1, "deckNameRequired"),
  description: z.string().trim(),
  groupId: z.string(),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
export type DeckFormValues = z.infer<typeof deckSchema>;
