export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5;
export type SchedulerAlgorithm = "sm-2" | "fsrs";

export interface ReviewState {
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  intervalMinutes?: number;
  fsrsStability?: number;
  fsrsDifficulty?: number;
  fsrsState?: number;
  fsrsLapses?: number;
  schedulerAlgorithm?: SchedulerAlgorithm;
}

export interface ReviewRecord {
  reviewedAt: string;
  rating: ReviewRating;
  previousIntervalDays: number;
  nextIntervalDays: number;
  previousIntervalMinutes?: number;
  nextIntervalMinutes?: number;
  algorithm: SchedulerAlgorithm;
  algorithmVersion: string;
}

export interface ScheduleResult {
  nextState: ReviewState;
  review: ReviewRecord;
}

export interface Scheduler {
  schedule(
    state: ReviewState,
    rating: ReviewRating,
    reviewedAt: Date,
  ): ScheduleResult;
}
