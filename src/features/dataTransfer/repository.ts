import type { SQLiteBindValue } from "expo-sqlite";
import type { ExportCollections } from "./format";

export interface DataTransferDatabase {
  execAsync(sql: string): Promise<void>;
  getAllAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T[]>;
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
}

interface DeckRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface CardRow {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  due_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
}

interface ReviewRow {
  id: string;
  card_id: string;
  reviewed_at: string;
  rating: number;
  previous_interval_days: number;
  next_interval_days: number;
  algorithm: string;
  algorithm_version: string;
}

export function createDataTransferRepository(database: DataTransferDatabase) {
  return {
    async exportData(): Promise<ExportCollections> {
      const [decks, cards, reviews] = await Promise.all([
        database.getAllAsync<DeckRow>(
          "SELECT id, name, description, created_at, updated_at FROM decks ORDER BY created_at ASC",
          [],
        ),
        database.getAllAsync<CardRow>(
          `SELECT id, deck_id, front, back, due_at, interval_days,
             ease_factor, repetitions, created_at, updated_at
           FROM cards ORDER BY created_at ASC`,
          [],
        ),
        database.getAllAsync<ReviewRow>(
          `SELECT id, card_id, reviewed_at, rating, previous_interval_days,
             next_interval_days, algorithm, algorithm_version
           FROM review_history ORDER BY reviewed_at ASC`,
          [],
        ),
      ]);

      return {
        decks: decks.map((deck) => ({
          id: deck.id,
          name: deck.name,
          description: deck.description,
          createdAt: deck.created_at,
          updatedAt: deck.updated_at,
        })),
        cards: cards.map((card) => ({
          id: card.id,
          deckId: card.deck_id,
          front: card.front,
          back: card.back,
          dueAt: card.due_at,
          intervalDays: card.interval_days,
          easeFactor: card.ease_factor,
          repetitions: card.repetitions,
          createdAt: card.created_at,
          updatedAt: card.updated_at,
        })),
        reviews: reviews.map((review) => ({
          id: review.id,
          cardId: review.card_id,
          reviewedAt: review.reviewed_at,
          rating: review.rating,
          previousIntervalDays: review.previous_interval_days,
          nextIntervalDays: review.next_interval_days,
          algorithm: review.algorithm,
          algorithmVersion: review.algorithm_version,
        })),
      };
    },

    async importData(data: ExportCollections): Promise<void> {
      await database.execAsync("BEGIN");

      try {
        for (const deck of data.decks) {
          await database.runAsync(
            `INSERT OR IGNORE INTO decks (
              id, name, description, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?)`,
            deck.id,
            deck.name,
            deck.description,
            deck.createdAt,
            deck.updatedAt,
          );
        }

        for (const card of data.cards) {
          await database.runAsync(
            `INSERT OR IGNORE INTO cards (
              id, deck_id, front, back, due_at, interval_days,
              ease_factor, repetitions, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            card.id,
            card.deckId,
            card.front,
            card.back,
            card.dueAt,
            card.intervalDays,
            card.easeFactor,
            card.repetitions,
            card.createdAt,
            card.updatedAt,
          );
        }

        for (const review of data.reviews) {
          await database.runAsync(
            `INSERT OR IGNORE INTO review_history (
              id, card_id, reviewed_at, rating, previous_interval_days,
              next_interval_days, algorithm, algorithm_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            review.id,
            review.cardId,
            review.reviewedAt,
            review.rating,
            review.previousIntervalDays,
            review.nextIntervalDays,
            review.algorithm,
            review.algorithmVersion,
          );
        }

        await database.execAsync("COMMIT");
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    },
  };
}
