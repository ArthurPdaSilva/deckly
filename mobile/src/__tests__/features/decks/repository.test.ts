import type { Deck } from "../../../features/decks/domain/deck";
import { createDeckRepository } from "../../../features/decks/repository";

describe("SQLite deck repository", () => {
  it("persists a deck with the local database schema", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn(),
    };
    const repository = createDeckRepository(database);
    const deck: Deck = {
      id: "deck-1",
      name: "Inglês",
      description: "Verbos",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    };

    await repository.save(deck);

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO decks"),
      deck.id,
      deck.name,
      deck.description,
      null,
      0,
      deck.createdAt,
      deck.updatedAt,
    );
  });

  it("maps persisted rows to domain decks ordered by the database", async () => {
    const rows = [
      {
        id: "deck-2",
        name: "Matemática",
        description: "",
        created_at: "2026-01-02T10:00:00.000Z",
        updated_at: "2026-01-02T10:00:00.000Z",
      },
    ];
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue(rows),
    };
    const repository = createDeckRepository(database);

    await expect(repository.findAll()).resolves.toEqual([
      {
        id: "deck-2",
        name: "Matemática",
        description: "",
        createdAt: "2026-01-02T10:00:00.000Z",
        updatedAt: "2026-01-02T10:00:00.000Z",
        groupId: undefined,
        sortOrder: undefined,
      },
    ]);
    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY sort_order ASC"),
    );
  });

  it("updates a deck and removes it by id", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn(),
    };
    const repository = createDeckRepository(database);
    const deck: Deck = {
      id: "deck-1",
      name: "Espanhol",
      description: "Verbos",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-02T10:00:00.000Z",
    };

    await repository.update(deck);
    await repository.remove(deck.id);

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("UPDATE decks"),
      deck.name,
      deck.description,
      null,
      0,
      deck.updatedAt,
      deck.id,
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM decks WHERE id = ?",
      deck.id,
    );
  });
});
