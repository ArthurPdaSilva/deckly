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

function addMinutes(date: Date, minutes: number): string {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
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
      : 0;
    const intervalMinutes = passed ? intervalDays * 1440 : 1;
    const reviewedAtIso = reviewedAt.toISOString();

    return {
      nextState: {
        dueAt: passed
          ? addDays(reviewedAt, intervalDays)
          : addMinutes(reviewedAt, intervalMinutes),
        intervalDays,
        intervalMinutes,
        easeFactor,
        repetitions,
        schedulerAlgorithm: ALGORITHM,
      },
      review: {
        reviewedAt: reviewedAtIso,
        rating,
        previousIntervalDays: state.intervalDays,
        nextIntervalDays: intervalDays,
        previousIntervalMinutes:
          state.intervalMinutes ?? state.intervalDays * 1440,
        nextIntervalMinutes: intervalMinutes,
        algorithm: ALGORITHM,
        algorithmVersion: ALGORITHM_VERSION,
      },
    };
  }
}
