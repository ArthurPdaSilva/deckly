import {
  type Card,
  createEmptyCard,
  fsrs,
  type Grade,
  Rating,
  State,
} from "ts-fsrs";
import { clampRetention, DEFAULT_RETENTION } from "./algorithmRepository";
import type {
  ReviewRating,
  ReviewState,
  ScheduleResult,
  Scheduler,
} from "./domain/scheduler";

const ALGORITHM = "fsrs" as const;
const ALGORITHM_VERSION = "6";

function toGrade(rating: ReviewRating): Grade {
  if (rating <= 2) return Rating.Again as Grade;
  if (rating === 3) return Rating.Hard as Grade;
  if (rating === 4) return Rating.Good as Grade;
  return Rating.Easy as Grade;
}

const DAY_MS = 86_400_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Builds the card exactly as ts-fsrs expects it: persisted learning step and
 * real last review date. Cards that were reviewed with SM-2 (no FSRS state yet)
 * are converted into Review state, using the interval as stability.
 */
function toFsrsCard(state: ReviewState, reviewedAt: Date): Card {
  const due = new Date(state.dueAt);
  const fsrsState = state.fsrsState ?? State.New;

  if (fsrsState !== State.New && (state.fsrsStability ?? 0) > 0) {
    const lastReview = state.fsrsLastReviewAt
      ? new Date(state.fsrsLastReviewAt)
      : new Date(due.getTime() - state.intervalDays * DAY_MS);
    return {
      due,
      stability: state.fsrsStability as number,
      difficulty: state.fsrsDifficulty || 5,
      elapsed_days: 0,
      scheduled_days: state.intervalDays,
      learning_steps: state.fsrsLearningSteps ?? 0,
      reps: state.repetitions,
      lapses: state.fsrsLapses ?? 0,
      state: fsrsState,
      last_review: lastReview,
    };
  }

  if (state.repetitions > 0 && state.intervalDays >= 1) {
    return {
      due,
      stability: state.intervalDays,
      difficulty: clamp(10 - (state.easeFactor - 1.3) * (5 / 1.2), 1, 10),
      elapsed_days: 0,
      scheduled_days: state.intervalDays,
      learning_steps: 0,
      reps: state.repetitions,
      lapses: state.fsrsLapses ?? 0,
      state: State.Review,
      last_review: new Date(due.getTime() - state.intervalDays * DAY_MS),
    };
  }

  return createEmptyCard(reviewedAt);
}

export class FsrsScheduler implements Scheduler {
  private readonly scheduler;

  constructor(retention: number = DEFAULT_RETENTION) {
    this.scheduler = fsrs({
      request_retention: clampRetention(retention),
      enable_fuzz: false,
      enable_short_term: true,
      learning_steps: ["1m", "10m"],
      relearning_steps: ["10m"],
    });
  }

  schedule(
    state: ReviewState,
    rating: ReviewRating,
    reviewedAt: Date,
  ): ScheduleResult {
    const card = toFsrsCard(state, reviewedAt);
    const result = this.scheduler.next(card, reviewedAt, toGrade(rating));
    const nextDueAt = result.card.due.toISOString();
    const nextIntervalMinutes = Math.max(
      1,
      Math.round((result.card.due.getTime() - reviewedAt.getTime()) / 60000),
    );

    return {
      nextState: {
        ...state,
        dueAt: nextDueAt,
        intervalDays: Math.floor(nextIntervalMinutes / 1440),
        intervalMinutes: nextIntervalMinutes,
        repetitions: result.card.reps,
        fsrsStability: result.card.stability,
        fsrsDifficulty: result.card.difficulty,
        fsrsState: result.card.state,
        fsrsLapses: result.card.lapses,
        fsrsLearningSteps: result.card.learning_steps,
        fsrsLastReviewAt: reviewedAt.toISOString(),
        schedulerAlgorithm: ALGORITHM,
      },
      review: {
        reviewedAt: reviewedAt.toISOString(),
        rating,
        previousIntervalDays: state.intervalDays,
        nextIntervalDays: Math.floor(nextIntervalMinutes / 1440),
        previousIntervalMinutes:
          state.intervalMinutes ?? state.intervalDays * 1440,
        nextIntervalMinutes,
        algorithm: ALGORITHM,
        algorithmVersion: ALGORITHM_VERSION,
      },
    };
  }
}
