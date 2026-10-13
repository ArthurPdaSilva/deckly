import type {
  ReviewRating,
  ReviewState,
} from "../../../features/review/domain/scheduler";
import { FsrsScheduler } from "../../../features/review/fsrsScheduler";

function run(ratings: ReviewRating[], retention?: number) {
  const scheduler = new FsrsScheduler(retention);
  let now = new Date("2026-03-01T10:00:00.000Z");
  let state: ReviewState = {
    dueAt: now.toISOString(),
    intervalDays: 0,
    intervalMinutes: 0,
    easeFactor: 2.5,
    repetitions: 0,
  };
  const minutes: number[] = [];
  for (const rating of ratings) {
    const result = scheduler.schedule(state, rating, now);
    state = result.nextState;
    minutes.push(result.review.nextIntervalMinutes ?? 0);
    now = new Date(state.dueAt);
  }
  return { minutes, state };
}

describe("FSRS progression", () => {
  it("graduates from learning to review when always answering Good", () => {
    const { minutes, state } = run([4, 4, 4, 4, 4]);
    expect(minutes[0]).toBe(10);
    expect(minutes[1]).toBeGreaterThanOrEqual(1440);
    expect(minutes[2]).toBeGreaterThan(minutes[1]);
    expect(minutes[3]).toBeGreaterThan(minutes[2]);
    expect(minutes[4]).toBeGreaterThan(minutes[3]);
    expect(state.fsrsState).toBe(2);
  });

  it("gives a multi-day first interval for Easy", () => {
    const { minutes } = run([5]);
    expect(minutes[0]).toBeGreaterThanOrEqual(4 * 1440);
  });

  it("relearns after Again on a review card", () => {
    const { minutes, state } = run([4, 4, 4, 2]);
    expect(minutes[3]).toBe(10);
    expect(state.fsrsState).toBe(3);
    expect(state.fsrsLapses).toBe(1);
  });

  it("higher retention schedules shorter intervals", () => {
    const low = run([4, 4, 4, 4], 0.8).minutes[3];
    const high = run([4, 4, 4, 4], 0.95).minutes[3];
    expect(high).toBeLessThan(low);
  });

  it("converts SM-2 reviewed cards into FSRS review state", () => {
    const result = new FsrsScheduler().schedule(
      {
        dueAt: "2026-03-10T10:00:00.000Z",
        intervalDays: 9,
        intervalMinutes: 9 * 1440,
        easeFactor: 2.5,
        repetitions: 4,
        schedulerAlgorithm: "sm-2",
      },
      4,
      new Date("2026-03-10T10:00:00.000Z"),
    );
    expect(result.nextState.fsrsState).toBe(2);
    expect(result.nextState.intervalDays).toBeGreaterThanOrEqual(9);
  });
});
