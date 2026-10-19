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
  group_id: string | null;
  sort_order: number;
}

function audioExtension(uri: string): string {
  const match = /\.([a-zA-Z0-9]{1,5})$/.exec(uri);
  return match ? `.${match[1].toLowerCase()}` : ".audio";
}

interface GroupRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

interface CardRow {
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

interface ReviewRow {
  id: string;
  card_id: string;
  reviewed_at: string;
  rating: number;
  previous_interval_days: number;
  next_interval_days: number;
  previous_interval_minutes: number;
  next_interval_minutes: number;
  algorithm: string;
  algorithm_version: string;
}

export function createDataTransferRepository(database: DataTransferDatabase) {
  return {
    async exportData(
      readAudio?: (uri: string) => Promise<string | null>,
    ): Promise<ExportCollections> {
      const [groups, decks, cards, reviews] = await Promise.all([
        database.getAllAsync<GroupRow>(
          `SELECT id, name, created_at, updated_at, sort_order
           FROM deck_groups ORDER BY sort_order ASC, name ASC`,
          [],
        ),
        database.getAllAsync<DeckRow>(
          "SELECT id, name, description, group_id, sort_order, created_at, updated_at FROM decks ORDER BY created_at ASC",
          [],
        ),
        database.getAllAsync<CardRow>(
          `SELECT id, deck_id, front, back, front_audio_uri, due_at, interval_days,
              interval_minutes, ease_factor, repetitions, scheduler_algorithm,
              fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_lapses,
              fsrs_learning_steps, fsrs_last_review_at,
              created_at, updated_at
           FROM cards ORDER BY created_at ASC`,
          [],
        ),
        database.getAllAsync<ReviewRow>(
          `SELECT id, card_id, reviewed_at, rating, previous_interval_days,
              next_interval_days, previous_interval_minutes,
              next_interval_minutes, algorithm, algorithm_version
           FROM review_history ORDER BY reviewed_at ASC`,
          [],
        ),
      ]);

      const audioData = await Promise.all(
        cards.map((card) =>
          card.front_audio_uri && readAudio
            ? readAudio(card.front_audio_uri)
            : Promise.resolve(null),
        ),
      );

      return {
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          createdAt: group.created_at,
          updatedAt: group.updated_at,
          sortOrder: group.sort_order,
        })),
        decks: decks.map((deck) => ({
          id: deck.id,
          name: deck.name,
          description: deck.description,
          createdAt: deck.created_at,
          updatedAt: deck.updated_at,
          groupId: deck.group_id,
          sortOrder: deck.sort_order,
        })),
        cards: cards.map((card, index) => ({
          id: card.id,
          deckId: card.deck_id,
          front: card.front,
          back: card.back,
          frontAudioFile: card.front_audio_uri
            ? `${card.id}${audioExtension(card.front_audio_uri)}`
            : null,
          frontAudioData: audioData[index],
          dueAt: card.due_at,
          intervalDays: card.interval_days,
          easeFactor: card.ease_factor,
          repetitions: card.repetitions,
          intervalMinutes: card.interval_minutes,
          schedulerAlgorithm: card.scheduler_algorithm,
          fsrsStability: card.fsrs_stability,
          fsrsDifficulty: card.fsrs_difficulty,
          fsrsState: card.fsrs_state,
          fsrsLapses: card.fsrs_lapses,
          fsrsLearningSteps: card.fsrs_learning_steps,
          fsrsLastReviewAt: card.fsrs_last_review_at,
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
          previousIntervalMinutes: review.previous_interval_minutes,
          nextIntervalMinutes: review.next_interval_minutes,
          algorithm: review.algorithm,
          algorithmVersion: review.algorithm_version,
        })),
      };
    },

    /** Apaga baralhos, grupos, cartões e histórico; devolve os áudios a remover. */
    async deleteAllData(): Promise<string[]> {
      const audioRows = await database.getAllAsync<{
        front_audio_uri: string | null;
      }>(
        "SELECT front_audio_uri FROM cards WHERE front_audio_uri IS NOT NULL",
        [],
      );
      await database.execAsync("BEGIN");
      try {
        await database.execAsync("DELETE FROM review_history");
        await database.execAsync("DELETE FROM cards");
        await database.execAsync("DELETE FROM decks");
        await database.execAsync("DELETE FROM deck_groups");
        await database.execAsync("COMMIT");
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
      return audioRows
        .map((row) => row.front_audio_uri)
        .filter((uri): uri is string => Boolean(uri));
    },

    async attachCardAudio(cardId: string, audioUri: string): Promise<void> {
      await database.runAsync(
        "UPDATE cards SET front_audio_uri = ? WHERE id = ?",
        audioUri,
        cardId,
      );
    },

    async importData(data: ExportCollections): Promise<void> {
      await database.execAsync("BEGIN");

      try {
        for (const group of data.groups ?? []) {
          await database.runAsync(
            `INSERT OR IGNORE INTO deck_groups (
              id, name, created_at, updated_at, sort_order
            ) VALUES (?, ?, ?, ?, ?)`,
            group.id,
            group.name,
            group.createdAt,
            group.updatedAt,
            group.sortOrder,
          );
        }
        for (const deck of data.decks) {
          await database.runAsync(
            `INSERT OR IGNORE INTO decks (
              id, name, description, group_id, sort_order, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            deck.id,
            deck.name,
            deck.description,
            deck.groupId ?? null,
            deck.sortOrder ?? 0,
            deck.createdAt,
            deck.updatedAt,
          );
        }

        for (const card of data.cards) {
          await database.runAsync(
            `INSERT OR IGNORE INTO cards (
               id, deck_id, front, back, due_at, interval_days, interval_minutes,
               ease_factor, repetitions, scheduler_algorithm, fsrs_stability,
               fsrs_difficulty, fsrs_state, fsrs_lapses, fsrs_learning_steps,
               fsrs_last_review_at, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            card.id,
            card.deckId,
            card.front,
            card.back,
            card.dueAt,
            card.intervalDays,
            card.intervalMinutes ?? 0,
            card.easeFactor,
            card.repetitions,
            card.schedulerAlgorithm ?? "sm-2",
            card.fsrsStability ?? 0,
            card.fsrsDifficulty ?? 0,
            card.fsrsState ?? 0,
            card.fsrsLapses ?? 0,
            card.fsrsLearningSteps ?? 0,
            card.fsrsLastReviewAt ?? null,
            card.createdAt,
            card.updatedAt,
          );
        }

        for (const review of data.reviews) {
          await database.runAsync(
            `INSERT OR IGNORE INTO review_history (
               id, card_id, reviewed_at, rating, previous_interval_days,
               next_interval_days, previous_interval_minutes,
               next_interval_minutes, algorithm, algorithm_version
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            review.id,
            review.cardId,
            review.reviewedAt,
            review.rating,
            review.previousIntervalDays,
            review.nextIntervalDays,
            review.previousIntervalMinutes ??
              review.previousIntervalDays * 1440,
            review.nextIntervalMinutes ?? review.nextIntervalDays * 1440,
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
