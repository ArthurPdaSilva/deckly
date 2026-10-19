import type { DecklyDatabase } from "../../db/database";
import type {
  Deck,
  DeckGroup,
  DeckGroupRepository,
  DeckRepository,
} from "./domain";

export function createDeckGroupRepository(
  db: DecklyDatabase,
): DeckGroupRepository {
  return {
    async save(group: DeckGroup) {
      await db.groups.add(group);
    },

    async findAll() {
      const groups = await db.groups.toArray();
      return groups.sort(
        (first, second) =>
          first.sortOrder - second.sortOrder ||
          first.name.localeCompare(second.name),
      );
    },

    async update(group: DeckGroup) {
      await db.groups.put(group);
    },

    /** Os baralhos do grupo não são excluídos: ficam sem grupo. */
    async remove(id: string) {
      await db.transaction("rw", db.groups, db.decks, async () => {
        await db.decks
          .where("groupId")
          .equals(id)
          .modify((deck: Deck) => {
            deck.groupId = null;
          });
        await db.groups.delete(id);
      });
    },
  };
}

export function createDeckRepository(db: DecklyDatabase): DeckRepository {
  return {
    async save(deck: Deck) {
      await db.decks.add(deck);
    },

    async findAll() {
      const decks = await db.decks.toArray();
      return decks.sort(
        (first, second) =>
          (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
          first.createdAt.localeCompare(second.createdAt),
      );
    },

    async update(deck: Deck) {
      await db.decks.put(deck);
    },

    /** Remove também cartões, áudios e histórico de revisões do baralho. */
    async remove(id: string) {
      await db.transaction(
        "rw",
        [db.decks, db.cards, db.reviews, db.audios],
        async () => {
          const cardIds = await db.cards
            .where("deckId")
            .equals(id)
            .primaryKeys();
          await db.reviews.where("cardId").anyOf(cardIds).delete();
          await db.audios.bulkDelete(cardIds);
          await db.cards.bulkDelete(cardIds);
          await db.decks.delete(id);
        },
      );
    },
  };
}
