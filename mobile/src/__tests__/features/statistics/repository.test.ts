import { createStatisticsRepository } from "../../../features/statistics/repository";

describe("statistics repository", () => {
  it("loads the dashboard metrics for a deterministic day", async () => {
    const database = {
      getFirstAsync: jest
        .fn()
        .mockResolvedValueOnce({ count: 3 })
        .mockResolvedValueOnce({ count: 24 })
        .mockResolvedValueOnce({ count: 5 })
        .mockResolvedValueOnce({ count: 4 })
        .mockResolvedValueOnce({ average: 4.25 }),
      getAllAsync: jest.fn().mockResolvedValue([
        { rating: 2, count: 1 },
        { rating: 4, count: 1 },
        { rating: 5, count: 2 },
      ]),
    };

    const result = await createStatisticsRepository(database).getDashboardStats(
      new Date("2026-03-15T14:30:00.000Z"),
    );

    expect(result).toEqual({
      totalDecks: 3,
      totalCards: 24,
      dueCards: 5,
      reviewsToday: 4,
      averageRating: 4.25,
      ratingDistribution: { 0: 0, 1: 0, 2: 1, 3: 0, 4: 1, 5: 2 },
    });
    expect(database.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM review_history"),
      ["2026-03-15T00:00:00.000Z", "2026-03-16T00:00:00.000Z"],
    );
  });

  it("returns zero for an empty dashboard", async () => {
    const database = {
      getFirstAsync: jest.fn().mockResolvedValue({ count: 0, average: null }),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };

    await expect(
      createStatisticsRepository(database).getDashboardStats(
        new Date("2026-03-15T14:30:00.000Z"),
      ),
    ).resolves.toEqual({
      totalDecks: 0,
      totalCards: 0,
      dueCards: 0,
      reviewsToday: 0,
      averageRating: 0,
      ratingDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });
});
