import Dexie, { type Table } from "dexie";
import type { Flashcard, StoredAudio } from "../features/cards/domain";
import type { Deck, DeckGroup } from "../features/decks/domain";
import type { ReviewEntry } from "../features/review/domain";

export interface SettingRow {
  key: string;
  value: string;
}

export class DecklyDatabase extends Dexie {
  groups!: Table<DeckGroup, string>;
  decks!: Table<Deck, string>;
  cards!: Table<Flashcard, string>;
  reviews!: Table<ReviewEntry, string>;
  settings!: Table<SettingRow, string>;
  audios!: Table<StoredAudio, string>;

  constructor(name = "deckly") {
    super(name);
    // Cada alteração de schema ganha uma nova versão; nunca edite uma antiga.
    this.version(1).stores({
      groups: "id, sortOrder",
      decks: "id, groupId, sortOrder",
      cards: "id, deckId, dueAt",
      reviews: "id, cardId, reviewedAt",
      settings: "key",
      audios: "cardId",
    });
  }
}
