import type {
  ReviewRating,
  ReviewState,
  ScheduleResult,
  Scheduler,
} from "./domain/scheduler";

const ALGORITHM = "sm-2";
const ALGORITHM_VERSION = "1";

function roundEaseFactor(value: number): number {
  return Math.round(value * 100) / 100;
}

function addDays(date: Date, days: number): string {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString();
}

export class Sm2Scheduler implements Scheduler {
  schedule(
    state: ReviewState,
    rating: ReviewRating,
    reviewedAt: Date,
  ): ScheduleResult {
    const qualityDistance = 5 - rating;
    const easeFactor = Math.max(
      1.3,
      roundEaseFactor(
        state.easeFactor +
          0.1 -
          qualityDistance * (0.08 + qualityDistance * 0.02),
      ),
    );
    const passed = rating >= 3;
    const repetitions = passed ? state.repetitions + 1 : 0;
    const intervalDays = passed
      ? state.repetitions === 0
        ? 1
        : state.repetitions === 1
          ? 6
          : Math.max(1, Math.round(state.intervalDays * easeFactor))
      : 1;
    const reviewedAtIso = reviewedAt.toISOString();

    return {
      nextState: {
        dueAt: addDays(reviewedAt, intervalDays),
        intervalDays,
        easeFactor,
        repetitions,
      },
      review: {
        reviewedAt: reviewedAtIso,
        rating,
        previousIntervalDays: state.intervalDays,
        nextIntervalDays: intervalDays,
        algorithm: ALGORITHM,
        algorithmVersion: ALGORITHM_VERSION,
      },
    };
  }
}
