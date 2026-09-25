import type { SQLiteBindValue } from "expo-sqlite";
import type { Flashcard } from "../cards/domain/flashcard";
import type { ReviewRecord, ReviewState } from "./domain/scheduler";

export interface ReviewDatabase {
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: SQLiteBindValue[]): Promise<T[]>;
}

interface FlashcardRow {
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

function mapCard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    dueAt: row.due_at,
    intervalDays: row.interval_days,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createReviewRepository(database: ReviewDatabase) {
  return {
    async findDueCards(now: string): Promise<Flashcard[]> {
      const rows = await database.getAllAsync<FlashcardRow>(
        `SELECT id, deck_id, front, back, due_at, interval_days,
          ease_factor, repetitions, created_at, updated_at
         FROM cards
         WHERE due_at <= ?
         ORDER BY due_at ASC`,
        now,
      );

      return rows.map(mapCard);
    },

    async recordReview(
      cardId: string,
      reviewId: string,
      nextState: ReviewState,
      review: ReviewRecord,
    ): Promise<void> {
      await database.runAsync("BEGIN");

      try {
        await database.runAsync(
          `UPDATE cards
           SET due_at = ?, interval_days = ?, ease_factor = ?,
             repetitions = ?, updated_at = ?
           WHERE id = ?`,
          nextState.dueAt,
          nextState.intervalDays,
          nextState.easeFactor,
          nextState.repetitions,
          review.reviewedAt,
          cardId,
        );
        await database.runAsync(
          `INSERT INTO review_history (
            id, card_id, reviewed_at, rating, previous_interval_days,
            next_interval_days, algorithm, algorithm_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          reviewId,
          cardId,
          review.reviewedAt,
          review.rating,
          review.previousIntervalDays,
          review.nextIntervalDays,
          review.algorithm,
          review.algorithmVersion,
        );
        await database.runAsync("COMMIT");
      } catch (error) {
        await database.runAsync("ROLLBACK");
        throw error;
      }
    },
  };
}
