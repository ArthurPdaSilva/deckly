export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewState {
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface ReviewRecord {
  reviewedAt: string;
  rating: ReviewRating;
  previousIntervalDays: number;
  nextIntervalDays: number;
  algorithm: string;
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
