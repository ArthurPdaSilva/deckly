import type { Flashcard } from "../../../features/cards/domain/flashcard";
import { createFlashcardRepository } from "../../../features/cards/repository";

describe("SQLite flashcard repository", () => {
  it("persists a flashcard with its scheduling state", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn(),
    };
    const repository = createFlashcardRepository(database);
    const card: Flashcard = {
      id: "card-1",
      deckId: "deck-1",
      front: "Question",
      back: "Answer",
      dueAt: "2026-02-01T10:00:00.000Z",
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    };

    await repository.save(card);

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO cards"),
      card.id,
      card.deckId,
      card.front,
      card.back,
      card.dueAt,
      card.intervalDays,
      card.easeFactor,
      card.repetitions,
      card.createdAt,
      card.updatedAt,
    );
  });

  it("maps rows and filters by deck id", async () => {
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "card-1",
          deck_id: "deck-1",
          front: "Question",
          back: "Answer",
          due_at: "2026-02-01T10:00:00.000Z",
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
          created_at: "2026-02-01T10:00:00.000Z",
          updated_at: "2026-02-01T10:00:00.000Z",
        },
      ]),
    };
    const repository = createFlashcardRepository(database);

    await expect(repository.findByDeckId("deck-1")).resolves.toEqual([
      expect.objectContaining({ id: "card-1", deckId: "deck-1" }),
    ]);
    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE deck_id = ?"),
      ["deck-1"],
    );
  });

  it("updates and removes a flashcard by id", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn(),
    };
    const repository = createFlashcardRepository(database);
    const card: Flashcard = {
      id: "card-1",
      deckId: "deck-1",
      front: "Updated question",
      back: "Updated answer",
      dueAt: "2026-02-01T10:00:00.000Z",
      intervalDays: 2,
      easeFactor: 2.5,
      repetitions: 1,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-02T10:00:00.000Z",
    };

    await repository.update(card);
    await repository.remove(card.id);

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("UPDATE cards"),
      card.front,
      card.back,
      card.updatedAt,
      card.id,
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM cards WHERE id = ?",
      card.id,
    );
  });
});
