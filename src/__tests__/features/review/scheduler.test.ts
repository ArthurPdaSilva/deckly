import type { ReviewState } from "../../../features/review/domain/scheduler";
import { Sm2Scheduler } from "../../../features/review/sm2Scheduler";

const initialState: ReviewState = {
  dueAt: "2026-03-01T10:00:00.000Z",
  intervalDays: 0,
  easeFactor: 2.5,
  repetitions: 0,
};

describe("SM-2 scheduler", () => {
  it("schedules a new easy card for the next day", () => {
    const scheduler = new Sm2Scheduler();

    const result = scheduler.schedule(
      initialState,
      5,
      new Date("2026-03-01T10:00:00.000Z"),
    );

    expect(result.nextState).toEqual({
      dueAt: "2026-03-02T10:00:00.000Z",
      intervalDays: 1,
      intervalMinutes: 1440,
      easeFactor: 2.6,
      repetitions: 1,
      schedulerAlgorithm: "sm-2",
    });
    expect(result.review).toEqual({
      reviewedAt: "2026-03-01T10:00:00.000Z",
      rating: 5,
      previousIntervalDays: 0,
      nextIntervalDays: 1,
      previousIntervalMinutes: 0,
      nextIntervalMinutes: 1440,
      algorithm: "sm-2",
      algorithmVersion: "1",
    });
  });

  it("uses the classic six-day second interval after a successful review", () => {
    const scheduler = new Sm2Scheduler();
    const state: ReviewState = {
      ...initialState,
      dueAt: "2026-03-02T10:00:00.000Z",
      intervalDays: 1,
      easeFactor: 2.6,
      repetitions: 1,
    };

    const result = scheduler.schedule(
      state,
      4,
      new Date("2026-03-02T10:00:00.000Z"),
    );

    expect(result.nextState).toEqual({
      dueAt: "2026-03-08T10:00:00.000Z",
      intervalDays: 6,
      intervalMinutes: 8640,
      easeFactor: 2.6,
      repetitions: 2,
      schedulerAlgorithm: "sm-2",
    });
  });

  it("resets repetitions and shortens the interval after a lapse", () => {
    const scheduler = new Sm2Scheduler();
    const state: ReviewState = {
      ...initialState,
      dueAt: "2026-03-10T10:00:00.000Z",
      intervalDays: 8,
      easeFactor: 2.5,
      repetitions: 4,
    };

    const result = scheduler.schedule(
      state,
      2,
      new Date("2026-03-10T10:00:00.000Z"),
    );

    expect(result.nextState).toEqual({
      dueAt: "2026-03-10T10:01:00.000Z",
      intervalDays: 0,
      intervalMinutes: 1,
      easeFactor: 2.18,
      repetitions: 0,
      schedulerAlgorithm: "sm-2",
    });
  });
});
