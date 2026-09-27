import type { SQLiteBindValue } from "expo-sqlite";
import type { SchedulerAlgorithm } from "./domain/scheduler";

export interface AlgorithmDatabase {
  getFirstAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T | null>;
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
}

const KEY = "review_algorithm";

export function createAlgorithmRepository(database: AlgorithmDatabase) {
  return {
    async getActiveAlgorithm(): Promise<SchedulerAlgorithm> {
      const row = await database.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_state WHERE key = ?",
        [KEY],
      );
      return row?.value === "fsrs" ? "fsrs" : "sm-2";
    },

    async setActiveAlgorithm(algorithm: SchedulerAlgorithm): Promise<void> {
      await database.runAsync(
        `INSERT INTO app_state (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        KEY,
        algorithm,
      );
    },

    async resetSchedule(
      algorithm: SchedulerAlgorithm,
      now: string,
    ): Promise<void> {
      await database.runAsync(
        `UPDATE cards SET due_at = ?, interval_days = 0,
          interval_minutes = 0, ease_factor = 2.5, repetitions = 0,
          scheduler_algorithm = ?, fsrs_stability = 0,
          fsrs_difficulty = 0, fsrs_state = 0, fsrs_lapses = 0`,
        now,
        algorithm,
      );
    },
  };
}
