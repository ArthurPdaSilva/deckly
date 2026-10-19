import { FsrsScheduler } from "../../../features/review/fsrsScheduler";

describe("FsrsScheduler", () => {
  it("schedules a deterministic card and preserves FSRS state", () => {
    const result = new FsrsScheduler().schedule(
      {
        dueAt: "2026-03-01T10:00:00.000Z",
        intervalDays: 0,
        intervalMinutes: 0,
        easeFactor: 2.5,
        repetitions: 0,
      },
      4,
      new Date("2026-03-01T10:00:00.000Z"),
    );

    expect(result.review.algorithm).toBe("fsrs");
    expect(result.nextState.dueAt).not.toBe("2026-03-01T10:00:00.000Z");
    expect(result.nextState.fsrsStability).toBeGreaterThan(0);
    expect(result.nextState.fsrsDifficulty).toBeGreaterThan(0);
    expect(result.review.nextIntervalMinutes).toBeGreaterThan(0);
  });
});
