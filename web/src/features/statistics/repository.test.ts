import { describe, expect, it } from "vitest";
import { createTestServices, FIXED_NOW, makeCard } from "../../test/helpers";

function review(id: string, rating: number, reviewedAt: string) {
  return {
    id,
    cardId: "c1",
    reviewedAt,
    rating,
    previousIntervalDays: 0,
    nextIntervalDays: 1,
    algorithm: "sm-2",
    algorithmVersion: "1",
  };
}

describe("estatísticas", () => {
  it("devolve zeros quando não há dados", async () => {
    const services = createTestServices();

    expect(await services.statistics.getDashboardStats(FIXED_NOW)).toEqual({
      totalDecks: 0,
      totalCards: 0,
      dueCards: 0,
      reviewsToday: 0,
      averageRating: 0,
      ratingDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it("conta baralhos, cartões, vencidos, revisões de hoje e notas", async () => {
    const services = createTestServices();
    await services.cards.save(
      makeCard({ id: "c1", dueAt: "2026-10-19T08:00:00.000Z" }),
    );
    await services.cards.save(
      makeCard({ id: "c2", dueAt: "2026-11-30T08:00:00.000Z" }),
    );
    await services.decks.save({
      id: "deck-1",
      name: "D",
      description: "",
      createdAt: FIXED_NOW.toISOString(),
      updatedAt: FIXED_NOW.toISOString(),
    });
    await services.db.reviews.bulkAdd([
      review("r1", 2, FIXED_NOW.toISOString()),
      review("r2", 4, FIXED_NOW.toISOString()),
      review("r3", 5, "2020-01-01T10:00:00.000Z"),
    ]);

    const stats = await services.statistics.getDashboardStats(FIXED_NOW);

    expect(stats).toMatchObject({
      totalDecks: 1,
      totalCards: 2,
      dueCards: 1,
      reviewsToday: 2,
    });
    expect(stats.averageRating).toBeCloseTo(11 / 3);
    expect(stats.ratingDistribution).toMatchObject({ 2: 1, 4: 1, 5: 1 });
  });
});
