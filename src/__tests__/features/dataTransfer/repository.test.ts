import { createDataTransferRepository } from "../../../features/dataTransfer/repository";

describe("data transfer repository", () => {
  it("exports decks, cards and review history", async () => {
    const database = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: "deck-1",
            name: "Inglês",
            description: "",
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "card-1",
            deck_id: "deck-1",
            front: "Hello",
            back: "Olá",
            due_at: "2026-01-02",
            interval_days: 1,
            ease_factor: 2.5,
            repetitions: 1,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "review-1",
            card_id: "card-1",
            reviewed_at: "2026-01-01",
            rating: 5,
            previous_interval_days: 0,
            next_interval_days: 1,
            algorithm: "sm-2",
            algorithm_version: "1",
          },
        ]),
      runAsync: jest.fn().mockResolvedValue(undefined),
      execAsync: jest.fn().mockResolvedValue(undefined),
    };

    const result = await createDataTransferRepository(database).exportData();

    expect(result.decks[0].name).toBe("Inglês");
    expect(result.cards[0].deckId).toBe("deck-1");
    expect(result.reviews[0].cardId).toBe("card-1");
  });

  it("imports without replacing existing records and rolls back on failure", async () => {
    const database = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue(undefined),
      execAsync: jest.fn().mockResolvedValue(undefined),
    };

    await createDataTransferRepository(database).importData({
      decks: [],
      cards: [],
      reviews: [],
    });

    expect(database.execAsync).toHaveBeenCalledWith("BEGIN");
    expect(database.execAsync).toHaveBeenCalledWith("COMMIT");

    database.execAsync.mockClear();
    database.runAsync.mockRejectedValueOnce(new Error("write failed"));

    await expect(
      createDataTransferRepository(database).importData({
        decks: [
          {
            id: "deck-1",
            name: "Inglês",
            description: "",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
        cards: [],
        reviews: [],
      }),
    ).rejects.toThrow("write failed");
    expect(database.execAsync).toHaveBeenCalledWith("ROLLBACK");
  });
});
