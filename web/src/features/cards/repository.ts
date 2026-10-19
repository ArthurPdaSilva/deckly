import type { DecklyDatabase } from "../../db/database";
import type { Flashcard, FlashcardRepository, StoredAudio } from "./domain";

export function createFlashcardRepository(
  db: DecklyDatabase,
): FlashcardRepository {
  return {
    async save(card: Flashcard) {
      await db.cards.add(card);
    },

    async findByDeckId(deckId: string) {
      const cards = await db.cards.where("deckId").equals(deckId).toArray();
      return cards.sort((first, second) =>
        first.createdAt.localeCompare(second.createdAt),
      );
    },

    findById(id: string) {
      return db.cards.get(id);
    },

    async update(card: Flashcard) {
      await db.cards.put(card);
    },

    /** O histórico de revisões e o áudio acompanham o cartão. */
    async remove(id: string) {
      await db.transaction(
        "rw",
        [db.cards, db.reviews, db.audios],
        async () => {
          await db.reviews.where("cardId").equals(id).delete();
          await db.audios.delete(id);
          await db.cards.delete(id);
        },
      );
    },

    async moveToDeck(id: string, deckId: string, updatedAt: string) {
      await db.cards.update(id, { deckId, updatedAt });
    },

    async saveAudio(audio: StoredAudio) {
      await db.audios.put(audio);
    },

    findAudio(cardId: string) {
      return db.audios.get(cardId);
    },

    async removeAudio(cardId: string) {
      await db.audios.delete(cardId);
    },
  };
}
