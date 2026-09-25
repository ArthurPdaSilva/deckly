import type {
  CreateDeckInput,
  Deck,
  DeckRepository,
} from "../../../features/decks/domain/deck";
import { createDeck, listDecks } from "../../../features/decks/useCases";

function createRepository(initialDecks: Deck[] = []) {
  const savedDecks = [...initialDecks];
  const repository: DeckRepository = {
    async save(deck) {
      savedDecks.push(deck);
    },
    async findAll() {
      return savedDecks;
    },
  };

  return { repository, savedDecks };
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
});
