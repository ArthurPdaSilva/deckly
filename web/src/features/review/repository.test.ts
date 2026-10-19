import { beforeEach, describe, expect, it } from "vitest";
import type { Services } from "../../app/services";
import { createTestServices, FIXED_NOW, makeCard } from "../../test/helpers";
import { Sm2Scheduler } from "./sm2Scheduler";

let services: Services;
const now = FIXED_NOW.toISOString();

beforeEach(async () => {
  services = createTestServices();
  await services.groups.save({
    id: "g1",
    name: "G",
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
  });
  await services.decks.save({
    id: "d1",
    name: "D1",
    description: "",
    groupId: "g1",
    createdAt: now,
    updatedAt: now,
  });
  await services.decks.save({
    id: "d2",
    name: "D2",
    description: "",
    groupId: null,
    createdAt: now,
    updatedAt: now,
  });
  await services.cards.save(
    makeCard({ id: "a", deckId: "d1", dueAt: "2026-10-19T10:00:00.000Z" }),
  );
  await services.cards.save(
    makeCard({ id: "b", deckId: "d2", dueAt: "2026-10-19T09:00:00.000Z" }),
  );
  await services.cards.save(
    makeCard({ id: "c", deckId: "d1", dueAt: "2026-10-25T09:00:00.000Z" }),
  );
});

describe("repositório de revisão", () => {
  it("lista os cartões vencidos do mais antigo para o mais novo", async () => {
    const due = await services.reviews.findDueCards(now);

    expect(due.map((card) => card.id)).toEqual(["b", "a"]);
    expect(await services.reviews.countDueCards(now)).toBe(2);
  });

  it("filtra por baralho e por grupo", async () => {
    expect(
      (await services.reviews.findDueCards(now, "d2")).map((card) => card.id),
    ).toEqual(["b"]);
    expect(
      (await services.reviews.findDueCards(now, undefined, "g1")).map(
        (card) => card.id,
      ),
    ).toEqual(["a"]);
  });

  it("resume vencidos e próxima revisão por baralho", async () => {
    const summaries = await services.reviews.findDeckSummaries(now);
    const d1 = summaries.find((summary) => summary.deckId === "d1");

    expect(d1).toEqual({
      deckId: "d1",
      nextDueAt: "2026-10-19T10:00:00.000Z",
      dueCount: 1,
    });
  });

  it("grava o novo estado do cartão e o histórico juntos", async () => {
    const [card] = await services.reviews.findDueCards(now, "d2");
    if (!card) throw new Error("cartão não encontrado");
    const { nextState, review } = new Sm2Scheduler().schedule(
      { ...card },
      4,
      FIXED_NOW,
    );

    await services.reviews.recordReview(card.id, "review-1", nextState, review);

    const updated = await services.db.cards.get("b");
    expect(updated).toMatchObject({
      repetitions: 1,
      intervalDays: 1,
      schedulerAlgorithm: "sm-2",
    });
    expect(await services.db.reviews.get("review-1")).toMatchObject({
      cardId: "b",
      rating: 4,
      nextIntervalMinutes: 1440,
    });
  });
});

describe("configurações de algoritmo", () => {
  it("usa SM-2 e 90% de retenção por padrão", async () => {
    expect(await services.algorithm.getActiveAlgorithm()).toBe("sm-2");
    expect(await services.algorithm.getDesiredRetention()).toBe(0.9);
  });

  it("guarda o algoritmo e limita a retenção", async () => {
    await services.algorithm.setActiveAlgorithm("fsrs");
    await services.algorithm.setDesiredRetention(0.99);

    expect(await services.algorithm.getActiveAlgorithm()).toBe("fsrs");
    expect(await services.algorithm.getDesiredRetention()).toBe(0.97);
  });

  it("reinicia o agendamento sem apagar o histórico", async () => {
    await services.db.cards.update("a", {
      repetitions: 5,
      intervalDays: 30,
      easeFactor: 1.8,
    });
    await services.db.reviews.add({
      id: "r1",
      cardId: "a",
      reviewedAt: now,
      rating: 4,
      previousIntervalDays: 0,
      nextIntervalDays: 1,
      algorithm: "sm-2",
      algorithmVersion: "1",
    });

    await services.algorithm.resetSchedule("fsrs", now);

    expect(await services.db.cards.get("a")).toMatchObject({
      repetitions: 0,
      intervalDays: 0,
      easeFactor: 2.5,
      dueAt: now,
      schedulerAlgorithm: "fsrs",
    });
    expect(await services.db.reviews.count()).toBe(1);
  });
});
