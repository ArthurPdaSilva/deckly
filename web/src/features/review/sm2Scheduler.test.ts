import { describe, expect, it } from "vitest";
import type { ReviewState } from "./domain";
import { Sm2Scheduler } from "./sm2Scheduler";

const reviewedAt = new Date("2026-10-19T12:00:00.000Z");
const newCard: ReviewState = {
  dueAt: reviewedAt.toISOString(),
  intervalDays: 0,
  easeFactor: 2.5,
  repetitions: 0,
};

describe("Sm2Scheduler", () => {
  const scheduler = new Sm2Scheduler();

  it("agenda a primeira revisão correta para 1 dia", () => {
    const { nextState, review } = scheduler.schedule(newCard, 4, reviewedAt);

    expect(nextState.intervalDays).toBe(1);
    expect(nextState.repetitions).toBe(1);
    expect(nextState.dueAt).toBe("2026-10-20T12:00:00.000Z");
    expect(review).toMatchObject({
      rating: 4,
      algorithm: "sm-2",
      algorithmVersion: "1",
      nextIntervalMinutes: 1440,
    });
  });

  it("usa 6 dias na segunda revisão correta", () => {
    const { nextState } = scheduler.schedule(
      { ...newCard, repetitions: 1, intervalDays: 1 },
      4,
      reviewedAt,
    );

    expect(nextState.intervalDays).toBe(6);
  });

  it("multiplica o intervalo pelo fator de facilidade depois disso", () => {
    const { nextState } = scheduler.schedule(
      { ...newCard, repetitions: 2, intervalDays: 6 },
      5,
      reviewedAt,
    );

    expect(nextState.easeFactor).toBe(2.6);
    expect(nextState.intervalDays).toBe(16);
  });

  it("zera as repetições e volta em 1 minuto quando erra", () => {
    const { nextState, review } = scheduler.schedule(
      { ...newCard, repetitions: 3, intervalDays: 15 },
      2,
      reviewedAt,
    );

    expect(nextState.repetitions).toBe(0);
    expect(nextState.intervalDays).toBe(0);
    expect(nextState.intervalMinutes).toBe(1);
    expect(nextState.dueAt).toBe("2026-10-19T12:01:00.000Z");
    expect(review.previousIntervalMinutes).toBe(15 * 1440);
  });

  it("nunca deixa o fator de facilidade abaixo de 1,3", () => {
    const { nextState } = scheduler.schedule(
      { ...newCard, easeFactor: 1.3 },
      0,
      reviewedAt,
    );

    expect(nextState.easeFactor).toBe(1.3);
  });
});
