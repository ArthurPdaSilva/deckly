import type { Deck } from "../features/decks/domain/deck";

export type AppRoute =
  | { name: "decks" }
  | { name: "cards"; deck: Deck }
  | { name: "review" }
  | { name: "statistics" };
