import { fsrs, type Grade, Rating, State } from "ts-fsrs";
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

export class FsrsScheduler implements Scheduler {
  private readonly scheduler = fsrs({
    enable_fuzz: false,
    enable_short_term: true,
    learning_steps: ["1m", "10m"],
    relearning_steps: ["10m"],
  });

  schedule(
    state: ReviewState,
    rating: ReviewRating,
    reviewedAt: Date,
  ): ScheduleResult {
    const card = {
      due: new Date(state.dueAt),
      stability: state.fsrsStability || Math.max(0.1, state.intervalDays),
      difficulty: state.fsrsDifficulty || 5,
      elapsed_days: state.intervalDays,
      scheduled_days: state.intervalDays,
      learning_steps: 0,
      reps: state.repetitions,
      lapses: state.fsrsLapses ?? 0,
      state: state.fsrsState ?? State.New,
      last_review: state.dueAt,
    };
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
