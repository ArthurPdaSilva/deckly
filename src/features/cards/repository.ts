import type { SQLiteBindValue } from "expo-sqlite";
import type { FlashcardRepository } from "./domain/flashcard";

export interface FlashcardDatabase {
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T[]>;
}

interface FlashcardRow {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  front_audio_uri: string | null;
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
  fsrs_learning_steps: number;
  fsrs_last_review_at: string | null;
  created_at: string;
  updated_at: string;
}

export function createFlashcardRepository(
  database: FlashcardDatabase,
): FlashcardRepository {
  return {
    async save(card) {
      await database.runAsync(
        `INSERT INTO cards (
          id, deck_id, front, back, front_audio_uri, due_at, interval_days,
          ease_factor, repetitions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        card.id,
        card.deckId,
        card.front,
        card.back,
        card.frontAudioUri ?? null,
        card.dueAt,
        card.intervalDays,
        card.easeFactor,
        card.repetitions,
        card.createdAt,
        card.updatedAt,
      );
    },

    async findByDeckId(deckId) {
      const rows = await database.getAllAsync<FlashcardRow>(
        `SELECT id, deck_id, front, back, front_audio_uri, due_at, interval_days,
           ease_factor, repetitions, interval_minutes, scheduler_algorithm,
           fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_lapses,
           fsrs_learning_steps, fsrs_last_review_at,
           created_at, updated_at
         FROM cards
         WHERE deck_id = ?
         ORDER BY created_at ASC`,
        [deckId],
      );

      return rows.map((row) => ({
        id: row.id,
        deckId: row.deck_id,
        front: row.front,
        back: row.back,
        frontAudioUri: row.front_audio_uri ?? null,
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
        fsrsLearningSteps: row.fsrs_learning_steps,
        fsrsLastReviewAt: row.fsrs_last_review_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },

    async update(card) {
      await database.runAsync(
        `UPDATE cards
         SET front = ?, back = ?, front_audio_uri = ?, updated_at = ?
         WHERE id = ?`,
        card.front,
        card.back,
        card.frontAudioUri ?? null,
        card.updatedAt,
        card.id,
      );
    },

    async remove(id) {
      await database.runAsync("DELETE FROM cards WHERE id = ?", id);
    },

    async moveToDeck(id, deckId, updatedAt) {
      await database.runAsync(
        `UPDATE cards
         SET deck_id = ?, updated_at = ?
         WHERE id = ?`,
        deckId,
        updatedAt,
        id,
      );
    },
  };
}
