import type { Deck } from "../../../features/decks/domain/deck";
import type { DeckGroup } from "../../../features/decks/domain/deckGroup";
import {
  createDeckGroup,
  moveDeck,
  renameDeckGroup,
  reorderDeckGroups,
  reorderDecks,
} from "../../../features/decks/groupUseCases";

const group: DeckGroup = {
  id: "group-1",
  name: "Idiomas",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  sortOrder: 0,
};

const deck: Deck = {
  id: "deck-1",
  name: "Inglês",
  description: "",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  groupId: null,
  sortOrder: 0,
};

describe("deck group use cases", () => {
  it("creates and renames groups with normalized names", async () => {
    const repository = {
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      remove: jest.fn(),
    };
    const now = new Date("2026-02-01T10:00:00.000Z");

    const created = await createDeckGroup(repository, "  Idiomas  ", {
      now,
      createId: () => "group-1",
      sortOrder: 2,
    });
    const renamed = await renameDeckGroup(
      repository,
      created,
      " Línguas ",
      now,
    );

    expect(created.name).toBe("Idiomas");
    expect(renamed.name).toBe("Línguas");
    expect(repository.save).toHaveBeenCalledWith(created);
    expect(repository.update).toHaveBeenCalledWith(renamed);
  });

  it("moves decks and persists both deck and group order", async () => {
    const repository = {
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      remove: jest.fn(),
    };
    const now = new Date("2026-02-01T10:00:00.000Z");

    await moveDeck(repository, deck, group.id, 3, now);
    await reorderDecks(repository, [deck], now);
    await reorderDeckGroups(repository, [group], now);

    expect(repository.update).toHaveBeenCalledTimes(3);
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: group.id, sortOrder: 3 }),
    );
  });
});
