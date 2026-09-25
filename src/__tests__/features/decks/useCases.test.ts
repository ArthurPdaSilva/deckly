import type {
  CreateDeckInput,
  Deck,
  DeckRepository,
} from "../../../features/decks/domain/deck";
import {
  createDeck,
  deleteDeck,
  listDecks,
  updateDeck,
} from "../../../features/decks/useCases";

function createRepository(initialDecks: Deck[] = []) {
  const savedDecks = [...initialDecks];
  const updatedDecks: Deck[] = [];
  const removedDeckIds: string[] = [];
  const repository: DeckRepository = {
    async save(deck) {
      savedDecks.push(deck);
    },
    async findAll() {
      return savedDecks;
    },
    async update(deck) {
      updatedDecks.push(deck);
    },
    async remove(id) {
      removedDeckIds.push(id);
    },
  };

  return { repository, savedDecks, updatedDecks, removedDeckIds };
}

describe("deck use cases", () => {
  it("creates a deck with normalized content and deterministic metadata", async () => {
    const { repository, savedDecks } = createRepository();
    const input: CreateDeckInput = {
      name: "  Inglês  ",
      description: "  Verbos irregulares ",
    };
    const now = new Date("2026-01-01T10:00:00.000Z");

    const deck = await createDeck(repository, input, {
      now,
      createId: () => "deck-1",
    });

    expect(deck).toEqual({
      id: "deck-1",
      name: "Inglês",
      description: "Verbos irregulares",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(savedDecks).toEqual([deck]);
  });

  it("rejects a deck without a name", async () => {
    const { repository, savedDecks } = createRepository();

    await expect(
      createDeck(
        repository,
        { name: "   " },
        {
          now: new Date("2026-01-01T10:00:00.000Z"),
          createId: () => "deck-1",
        },
      ),
    ).rejects.toThrow("Deck name cannot be empty");
    expect(savedDecks).toEqual([]);
  });

  it("lists decks through the repository contract", async () => {
    const decks: Deck[] = [
      {
        id: "deck-1",
        name: "Inglês",
        description: "",
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
    ];
    const { repository } = createRepository(decks);

    await expect(listDecks(repository)).resolves.toEqual(decks);
  });

  it("updates a deck while preserving its creation date", async () => {
    const originalDeck: Deck = {
      id: "deck-1",
      name: "Inglês",
      description: "",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    };
    const { repository, updatedDecks } = createRepository([originalDeck]);
    const updatedAt = new Date("2026-01-02T10:00:00.000Z");

    const deck = await updateDeck(
      repository,
      originalDeck,
      { name: "  Espanhol  ", description: "  Verbos  " },
      updatedAt,
    );

    expect(deck).toEqual({
      ...originalDeck,
      name: "Espanhol",
      description: "Verbos",
      updatedAt: updatedAt.toISOString(),
    });
    expect(updatedDecks).toEqual([deck]);
  });

  it("deletes a deck through the repository contract", async () => {
    const { repository, removedDeckIds } = createRepository();

    await deleteDeck(repository, "deck-1");

    expect(removedDeckIds).toEqual(["deck-1"]);
  });
});
