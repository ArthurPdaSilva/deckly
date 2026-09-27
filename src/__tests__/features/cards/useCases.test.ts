import type {
  CreateFlashcardInput,
  Flashcard,
  FlashcardRepository,
} from "../../../features/cards/domain/flashcard";
import {
  createFlashcard,
  deleteFlashcard,
  listFlashcards,
  updateFlashcard,
} from "../../../features/cards/useCases";

function createRepository() {
  const savedCards: Flashcard[] = [];
  const updatedCards: Flashcard[] = [];
  const removedCardIds: string[] = [];
  const repository: FlashcardRepository = {
    async save(card) {
      savedCards.push(card);
    },
    async findByDeckId() {
      return savedCards;
    },
    async update(card) {
      updatedCards.push(card);
    },
    async remove(id) {
      removedCardIds.push(id);
    },
  };

  return { repository, savedCards, updatedCards, removedCardIds };
}

describe("flashcard use cases", () => {
  it("creates a flashcard linked to its deck", async () => {
    const { repository, savedCards } = createRepository();
    const input: CreateFlashcardInput = {
      front: "What is spaced repetition?",
      back: "A learning method based on increasing intervals.",
    };
    const now = new Date("2026-02-01T10:00:00.000Z");

    const card = await createFlashcard(repository, "deck-1", input, {
      now,
      createId: () => "card-1",
    });

    expect(card).toEqual({
      id: "card-1",
      deckId: "deck-1",
      front: input.front,
      back: input.back,
      dueAt: now.toISOString(),
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(savedCards).toEqual([card]);
  });

  it("rejects a flashcard with an empty front or back", async () => {
    const { repository, savedCards } = createRepository();
    const options = {
      now: new Date("2026-02-01T10:00:00.000Z"),
      createId: () => "card-1",
    };

    await expect(
      createFlashcard(
        repository,
        "deck-1",
        { front: " ", back: "Answer" },
        options,
      ),
    ).rejects.toThrow("A frente do cartão não pode ficar vazia");
    await expect(
      createFlashcard(
        repository,
        "deck-1",
        { front: "Question", back: " " },
        options,
      ),
    ).rejects.toThrow("O verso do cartão não pode ficar vazio");
    expect(savedCards).toEqual([]);
  });

  it("lists flashcards by deck", async () => {
    const { repository } = createRepository();

    await expect(listFlashcards(repository, "deck-1")).resolves.toEqual([]);
  });

  it("updates a flashcard while preserving its scheduling state", async () => {
    const originalCard: Flashcard = {
      id: "card-1",
      deckId: "deck-1",
      front: "Question",
      back: "Answer",
      dueAt: "2026-02-01T10:00:00.000Z",
      intervalDays: 4,
      easeFactor: 2.7,
      repetitions: 3,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    };
    const { repository, updatedCards } = createRepository();
    const updatedAt = new Date("2026-02-02T10:00:00.000Z");

    const card = await updateFlashcard(
      repository,
      originalCard,
      { front: " Updated question ", back: " Updated answer " },
      updatedAt,
    );

    expect(card).toEqual({
      ...originalCard,
      front: "Updated question",
      back: "Updated answer",
      updatedAt: updatedAt.toISOString(),
    });
    expect(updatedCards).toEqual([card]);
  });

  it("deletes a flashcard through the repository contract", async () => {
    const { repository, removedCardIds } = createRepository();

    await deleteFlashcard(repository, "card-1");

    expect(removedCardIds).toEqual(["card-1"]);
  });
});
