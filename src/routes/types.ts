import type { Flashcard } from "../features/cards/domain/flashcard";
import type { Deck } from "../features/decks/domain/deck";
import type { DeckGroup } from "../features/decks/domain/deckGroup";

export type AppRoute =
  | { name: "home" }
  | { name: "groups" }
  | { name: "decks"; groupId?: string | null }
  | { name: "cards"; deck: Deck }
  | { name: "groupForm"; group?: DeckGroup }
  | { name: "deckForm"; deck?: Deck; groupId?: string | null }
  | { name: "cardForm"; deck: Deck; card?: Flashcard }
  | { name: "moveCard"; deck: Deck; card: Flashcard }
  | { name: "review"; deck?: Deck; group?: DeckGroup }
  | { name: "statistics" }
  | { name: "settings" };

export type RootStackParamList = {
  home: undefined;
  groups: undefined;
  decks: { groupId?: string | null } | undefined;
  cards: { deck: Deck };
  review: { deck?: Deck; group?: DeckGroup } | undefined;
  groupForm: { group?: DeckGroup };
  deckForm: { deck?: Deck; groupId?: string | null };
  cardForm: { deck: Deck; card?: Flashcard };
  moveCard: { deck: Deck; card: Flashcard };
  statistics: undefined;
  settings: undefined;
};
