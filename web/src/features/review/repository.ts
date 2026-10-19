import type { DecklyDatabase } from "../../db/database";
import type { Flashcard } from "../cards/domain";
import type { ReviewRecord, ReviewState, SchedulerAlgorithm } from "./domain";
import { clampRetention, DEFAULT_RETENTION } from "./retention";

export interface DeckReviewSummary {
  deckId: string;
  nextDueAt: string | null;
  dueCount: number;
}

const ALGORITHM_KEY = "review_algorithm";
const RETENTION_KEY = "fsrs_desired_retention";

export function createReviewRepository(db: DecklyDatabase) {
  return {
    async findDueCards(
      now: string,
      deckId?: string,
      groupId?: string,
    ): Promise<Flashcard[]> {
      const due = await db.cards
        .where("dueAt")
        .belowOrEqual(now)
        .sortBy("dueAt");

      if (groupId) {
        const deckIds = new Set(
          (await db.decks.where("groupId").equals(groupId).primaryKeys()).map(
            String,
          ),
        );
        return due.filter((card) => deckIds.has(card.deckId));
      }

      return deckId ? due.filter((card) => card.deckId === deckId) : due;
    },

    countDueCards(now: string): Promise<number> {
      return db.cards.where("dueAt").belowOrEqual(now).count();
    },

    async findDeckSummaries(now: string): Promise<DeckReviewSummary[]> {
      const summaries = new Map<string, DeckReviewSummary>();

      await db.cards.each((card) => {
        const summary = summaries.get(card.deckId) ?? {
          deckId: card.deckId,
          nextDueAt: null,
          dueCount: 0,
        };
        if (summary.nextDueAt === null || card.dueAt < summary.nextDueAt) {
          summary.nextDueAt = card.dueAt;
        }
        if (card.dueAt <= now) summary.dueCount += 1;
        summaries.set(card.deckId, summary);
      });

      return [...summaries.values()];
    },

    /** Atualiza o cartão e grava o histórico na mesma transação. */
    async recordReview(
      cardId: string,
      reviewId: string,
      nextState: ReviewState,
      review: ReviewRecord,
    ): Promise<void> {
      await db.transaction("rw", db.cards, db.reviews, async () => {
        await db.cards.update(cardId, {
          dueAt: nextState.dueAt,
          intervalDays: nextState.intervalDays,
          intervalMinutes:
            nextState.intervalMinutes ?? nextState.intervalDays * 1440,
          easeFactor: nextState.easeFactor,
          repetitions: nextState.repetitions,
          schedulerAlgorithm: nextState.schedulerAlgorithm ?? review.algorithm,
          fsrsStability: nextState.fsrsStability ?? 0,
          fsrsDifficulty: nextState.fsrsDifficulty ?? 0,
          fsrsState: nextState.fsrsState ?? 0,
          fsrsLapses: nextState.fsrsLapses ?? 0,
          fsrsLearningSteps: nextState.fsrsLearningSteps ?? 0,
          fsrsLastReviewAt: nextState.fsrsLastReviewAt ?? null,
          updatedAt: review.reviewedAt,
        });
        await db.reviews.add({
          id: reviewId,
          cardId,
          reviewedAt: review.reviewedAt,
          rating: review.rating,
          previousIntervalDays: review.previousIntervalDays,
          nextIntervalDays: review.nextIntervalDays,
          previousIntervalMinutes:
            review.previousIntervalMinutes ??
            review.previousIntervalDays * 1440,
          nextIntervalMinutes:
            review.nextIntervalMinutes ?? review.nextIntervalDays * 1440,
          algorithm: review.algorithm,
          algorithmVersion: review.algorithmVersion,
        });
      });
    },
  };
}

export function createAlgorithmRepository(db: DecklyDatabase) {
  return {
    async getActiveAlgorithm(): Promise<SchedulerAlgorithm> {
      const row = await db.settings.get(ALGORITHM_KEY);
      return row?.value === "fsrs" ? "fsrs" : "sm-2";
    },

    async setActiveAlgorithm(algorithm: SchedulerAlgorithm): Promise<void> {
      await db.settings.put({ key: ALGORITHM_KEY, value: algorithm });
    },

    async getDesiredRetention(): Promise<number> {
      const row = await db.settings.get(RETENTION_KEY);
      return row ? clampRetention(Number(row.value)) : DEFAULT_RETENTION;
    },

    async setDesiredRetention(value: number): Promise<void> {
      await db.settings.put({
        key: RETENTION_KEY,
        value: String(clampRetention(value)),
      });
    },

    /** Reinicia o agendamento de todos os cartões; o histórico permanece. */
    async resetSchedule(
      algorithm: SchedulerAlgorithm,
      now: string,
    ): Promise<void> {
      await db.cards.toCollection().modify((card: Flashcard) => {
        card.dueAt = now;
        card.intervalDays = 0;
        card.intervalMinutes = 0;
        card.easeFactor = 2.5;
        card.repetitions = 0;
        card.schedulerAlgorithm = algorithm;
        card.fsrsStability = 0;
        card.fsrsDifficulty = 0;
        card.fsrsState = 0;
        card.fsrsLapses = 0;
        card.fsrsLearningSteps = 0;
        card.fsrsLastReviewAt = null;
      });
    },
  };
}
