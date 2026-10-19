import { describe, expect, it } from "vitest";
import type { ReviewState } from "./domain";
import { FsrsScheduler } from "./fsrsScheduler";
import { clampRetention, DEFAULT_RETENTION } from "./retention";
import { createScheduler } from "./schedulerFactory";
import { Sm2Scheduler } from "./sm2Scheduler";

const reviewedAt = new Date("2026-10-19T12:00:00.000Z");
const newCard: ReviewState = {
  dueAt: reviewedAt.toISOString(),
  intervalDays: 0,
  easeFactor: 2.5,
  repetitions: 0,
};

describe("FsrsScheduler", () => {
  const scheduler = new FsrsScheduler();

  it("mantém um cartão novo errado em aprendizado de curto prazo", () => {
    const { nextState, review } = scheduler.schedule(newCard, 2, reviewedAt);

    expect(nextState.schedulerAlgorithm).toBe("fsrs");
    expect(nextState.intervalMinutes).toBe(1);
    expect(nextState.fsrsLastReviewAt).toBe(reviewedAt.toISOString());
    expect(review).toMatchObject({ algorithm: "fsrs", algorithmVersion: "6" });
  });

  it("deixa o 'Fácil' mais distante que o 'Bom'", () => {
    const good = scheduler.schedule(newCard, 4, reviewedAt).nextState;
    const easy = scheduler.schedule(newCard, 5, reviewedAt).nextState;

    expect(easy.intervalMinutes ?? 0).toBeGreaterThan(
      good.intervalMinutes ?? 0,
    );
    expect(easy.intervalMinutes ?? 0).toBeGreaterThanOrEqual(1440);
  });

  it("converte um cartão revisado com SM-2 em cartão em revisão", () => {
    const { nextState } = scheduler.schedule(
      {
        dueAt: reviewedAt.toISOString(),
        intervalDays: 6,
        easeFactor: 2.5,
        repetitions: 2,
        schedulerAlgorithm: "sm-2",
      },
      4,
      reviewedAt,
    );

    expect(nextState.fsrsStability ?? 0).toBeGreaterThan(0);
    expect(nextState.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it("aumenta o intervalo quando a retenção desejada é menor", () => {
    const state: ReviewState = {
      dueAt: reviewedAt.toISOString(),
      intervalDays: 10,
      easeFactor: 2.5,
      repetitions: 4,
    };
    const low = new FsrsScheduler(0.8).schedule(state, 4, reviewedAt).nextState;
    const high = new FsrsScheduler(0.95).schedule(
      state,
      4,
      reviewedAt,
    ).nextState;

    expect(low.intervalMinutes ?? 0).toBeGreaterThan(high.intervalMinutes ?? 0);
  });
});

describe("clampRetention", () => {
  it("limita a retenção entre 70% e 97%", () => {
    expect(clampRetention(0.5)).toBe(0.7);
    expect(clampRetention(0.99)).toBe(0.97);
    expect(clampRetention(0.85)).toBe(0.85);
    expect(clampRetention(Number.NaN)).toBe(DEFAULT_RETENTION);
  });
});

describe("createScheduler", () => {
  it("escolhe o agendador pelo algoritmo ativo", () => {
    expect(createScheduler("sm-2")).toBeInstanceOf(Sm2Scheduler);
    expect(createScheduler("fsrs")).toBeInstanceOf(FsrsScheduler);
  });
});
