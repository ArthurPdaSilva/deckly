import { createDataTransferRepository } from "../../../features/dataTransfer/repository";

describe("data transfer repository", () => {
  it("exports decks, cards and review history", async () => {
    const database = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: "group-1",
            name: "Idiomas",
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
            sort_order: 0,
          },
        ])
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
    expect(result.groups?.[0].name).toBe("Idiomas");
    expect(result.cards[0].deckId).toBe("deck-1");
    expect(result.reviews[0].cardId).toBe("card-1");
  });

  it("embeds card audio as base64 when a reader is provided", async () => {
    const card = {
      id: "card-1",
      deck_id: "deck-1",
      front: "Hello",
      back: "Olá",
      front_audio_uri: "file:///docs/card-audio/audio-1.mp3",
      due_at: "2026-01-02",
      interval_days: 1,
      ease_factor: 2.5,
      repetitions: 1,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    const database = {
      getAllAsync: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([card])
        .mockResolvedValueOnce([]),
      runAsync: jest.fn().mockResolvedValue(undefined),
      execAsync: jest.fn().mockResolvedValue(undefined),
    };
    const readAudio = jest.fn().mockResolvedValue("QUJD");

    const result =
      await createDataTransferRepository(database).exportData(readAudio);

    expect(readAudio).toHaveBeenCalledWith(card.front_audio_uri);
    expect(result.cards[0].frontAudioData).toBe("QUJD");
    expect(result.cards[0].frontAudioFile).toBe("card-1.mp3");
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

  it("uses one placeholder per column when inserting imported cards", async () => {
    const database = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue(undefined),
      execAsync: jest.fn().mockResolvedValue(undefined),
    };

    await createDataTransferRepository(database).importData({
      decks: [
        {
          id: "deck-1",
          name: "Inglês",
          description: "",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
      cards: [
        {
          id: "card-1",
          deckId: "deck-1",
          front: "Hello",
          back: "Olá",
          dueAt: "2026-01-01",
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
      reviews: [],
    });

    const call = database.runAsync.mock.calls.find(([sql]) =>
      String(sql).includes("INSERT OR IGNORE INTO cards"),
    );
    const sql = String(call?.[0]);
    const columns = /INTO cards \(([^)]*)\)/.exec(sql)?.[1].split(",") ?? [];
    const placeholders = /VALUES \(([^)]*)\)/.exec(sql)?.[1].split(",") ?? [];
    expect(placeholders).toHaveLength(columns.length);
    expect(call?.length).toBe(1 + columns.length);
  });
});
