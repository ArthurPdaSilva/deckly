import type {
  CreateFlashcardInput,
  Flashcard,
  FlashcardRepository,
} from "../../../features/cards/domain/flashcard";
import {
  createFlashcard,
  listFlashcards,
} from "../../../features/cards/useCases";

function createRepository() {
  const savedCards: Flashcard[] = [];
  const repository: FlashcardRepository = {
    async save(card) {
      savedCards.push(card);
    },
    async findByDeckId() {
      return savedCards;
    },
  };

  return { repository, savedCards };
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
    ).rejects.toThrow("Flashcard front cannot be empty");
    await expect(
      createFlashcard(
        repository,
        "deck-1",
        { front: "Question", back: " " },
        options,
      ),
    ).rejects.toThrow("Flashcard back cannot be empty");
    expect(savedCards).toEqual([]);
  });

  it("lists flashcards by deck", async () => {
    const { repository } = createRepository();

    await expect(listFlashcards(repository, "deck-1")).resolves.toEqual([]);
  });
});
