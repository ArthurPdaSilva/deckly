import { describe, expect, it } from "vitest";
import { makeCard } from "../../test/helpers";
import type { ReviewState } from "./domain";
import { advanceQueue, toReviewState } from "./session";
import { formatCompactReviewInterval, formatTimeUntil } from "./time";

const reviewedAt = new Date("2026-10-19T12:00:00.000Z");

function stateDueIn(minutes: number): ReviewState {
  return {
    dueAt: new Date(reviewedAt.getTime() + minutes * 60_000).toISOString(),
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 1,
  };
}

describe("advanceQueue", () => {
  const queue = [makeCard({ id: "a" }), makeCard({ id: "b" })];

  it("recoloca no fim o cartão que volta em até 20 minutos", () => {
    const next = advanceQueue(queue, stateDueIn(10), reviewedAt);

    expect(next.map((card) => card.id)).toEqual(["b", "a"]);
    expect(next[1]?.dueAt).toBe(stateDueIn(10).dueAt);
  });

  it("tira da sessão o cartão que só volta depois da janela", () => {
    const next = advanceQueue(queue, stateDueIn(21), reviewedAt);

    expect(next.map((card) => card.id)).toEqual(["b"]);
  });

  it("não repete o último cartão da fila imediatamente", () => {
    const next = advanceQueue(
      [makeCard({ id: "a" })],
      stateDueIn(1),
      reviewedAt,
    );

    expect(next).toEqual([]);
  });
});

describe("toReviewState", () => {
  it("copia apenas o estado de agendamento do cartão", () => {
    const state = toReviewState(makeCard({ intervalDays: 3, repetitions: 2 }));

    expect(state).toMatchObject({
      intervalDays: 3,
      repetitions: 2,
      easeFactor: 2.5,
    });
    expect(state).not.toHaveProperty("front");
  });
});

describe("formatação de tempo", () => {
  it("formata o tempo até a próxima revisão em português e inglês", () => {
    const in3Hours = new Date(
      reviewedAt.getTime() + 3 * 3_600_000,
    ).toISOString();

    expect(formatTimeUntil(reviewedAt.toISOString(), reviewedAt)).toBe("agora");
    expect(formatTimeUntil(in3Hours, reviewedAt)).toBe("em 3 h");
    expect(formatTimeUntil(in3Hours, reviewedAt, "en")).toBe("in 3 hr");
  });

  it("abrevia intervalos em minutos, horas e dias", () => {
    expect(formatCompactReviewInterval(10)).toBe("10m");
    expect(formatCompactReviewInterval(180)).toBe("3h");
    expect(formatCompactReviewInterval(1440 * 6)).toBe("6d");
  });
});
