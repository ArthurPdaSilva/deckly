import type { SQLiteBindValue } from "expo-sqlite";
import type { Flashcard } from "../cards/domain/flashcard";
import type { ReviewRecord, ReviewState } from "./domain/scheduler";

export interface ReviewDatabase {
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T[]>;
}

export interface DeckReviewSummary {
  deckId: string;
  nextDueAt: string | null;
  dueCount: number;
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
  interval_minutes: number;
  scheduler_algorithm: "sm-2" | "fsrs";
  fsrs_stability: number;
  fsrs_difficulty: number;
  fsrs_state: number;
  fsrs_lapses: number;
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
    intervalMinutes: row.interval_minutes,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    schedulerAlgorithm: row.scheduler_algorithm,
    fsrsStability: row.fsrs_stability,
    fsrsDifficulty: row.fsrs_difficulty,
    fsrsState: row.fsrs_state,
    fsrsLapses: row.fsrs_lapses,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createReviewRepository(database: ReviewDatabase) {
  return {
    async findDueCards(
      now: string,
      deckId?: string,
      groupId?: string,
    ): Promise<Flashcard[]> {
      const rows = groupId
        ? await database.getAllAsync<FlashcardRow>(
            `SELECT c.id, c.deck_id, c.front, c.back, c.due_at, c.interval_days,
              c.ease_factor, c.repetitions, c.interval_minutes, c.scheduler_algorithm,
              c.fsrs_stability, c.fsrs_difficulty, c.fsrs_state, c.fsrs_lapses,
              c.created_at, c.updated_at
             FROM cards c
             JOIN decks d ON d.id = c.deck_id
             WHERE c.due_at <= ? AND d.group_id = ?
             ORDER BY c.due_at ASC`,
            [now, groupId],
          )
        : deckId
          ? await database.getAllAsync<FlashcardRow>(
              `SELECT id, deck_id, front, back, due_at, interval_days,
              ease_factor, repetitions, interval_minutes, scheduler_algorithm,
              fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_lapses,
              created_at, updated_at
             FROM cards
             WHERE due_at <= ? AND deck_id = ?
             ORDER BY due_at ASC`,
              [now, deckId],
            )
          : await database.getAllAsync<FlashcardRow>(
              `SELECT id, deck_id, front, back, due_at, interval_days,
              ease_factor, repetitions, interval_minutes, scheduler_algorithm,
              fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_lapses,
              created_at, updated_at
             FROM cards
             WHERE due_at <= ?
             ORDER BY due_at ASC`,
              [now],
            );

      return rows.map(mapCard);
    },

    async findDeckSummaries(now: string): Promise<DeckReviewSummary[]> {
      const rows = await database.getAllAsync<{
        deck_id: string;
        next_due_at: string | null;
        due_count: number;
      }>(
        `SELECT deck_id, MIN(due_at) AS next_due_at,
           SUM(CASE WHEN due_at <= ? THEN 1 ELSE 0 END) AS due_count
         FROM cards
         GROUP BY deck_id`,
        [now],
      );

      return rows.map((row) => ({
        deckId: row.deck_id,
        nextDueAt: row.next_due_at,
        dueCount: row.due_count,
      }));
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
             SET due_at = ?, interval_days = ?, interval_minutes = ?,
               ease_factor = ?, repetitions = ?, scheduler_algorithm = ?,
               fsrs_stability = ?, fsrs_difficulty = ?, fsrs_state = ?,
               fsrs_lapses = ?, updated_at = ?
             WHERE id = ?`,
          nextState.dueAt,
          nextState.intervalDays,
          nextState.intervalMinutes ?? nextState.intervalDays * 1440,
          nextState.easeFactor,
          nextState.repetitions,
          nextState.schedulerAlgorithm ?? review.algorithm,
          nextState.fsrsStability ?? 0,
          nextState.fsrsDifficulty ?? 0,
          nextState.fsrsState ?? 0,
          nextState.fsrsLapses ?? 0,
          review.reviewedAt,
          cardId,
        );
        await database.runAsync(
          `INSERT INTO review_history (
            id, card_id, reviewed_at, rating, previous_interval_days,
             next_interval_days, previous_interval_minutes,
             next_interval_minutes, algorithm, algorithm_version
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          reviewId,
          cardId,
          review.reviewedAt,
          review.rating,
          review.previousIntervalDays,
          review.nextIntervalDays,
          review.previousIntervalMinutes ?? review.previousIntervalDays * 1440,
          review.nextIntervalMinutes ?? review.nextIntervalDays * 1440,
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
