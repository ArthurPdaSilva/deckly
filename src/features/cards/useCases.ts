import type {
  CreateFlashcardInput,
  Flashcard,
  FlashcardRepository,
} from "./domain/flashcard";

export interface CreateFlashcardOptions {
  now: Date;
  createId: () => string;
}

export async function createFlashcard(
  repository: FlashcardRepository,
  deckId: string,
  input: CreateFlashcardInput,
  options: CreateFlashcardOptions,
): Promise<Flashcard> {
  const front = input.front.trim();
  const back = input.back.trim();

  if (!front) {
    throw new Error("Flashcard front cannot be empty");
  }

  if (!back) {
    throw new Error("Flashcard back cannot be empty");
  }

  const timestamp = options.now.toISOString();
  const card: Flashcard = {
    id: options.createId(),
    deckId,
    front,
    back,
    dueAt: timestamp,
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await repository.save(card);
  return card;
}

export function listFlashcards(
  repository: FlashcardRepository,
  deckId: string,
): Promise<Flashcard[]> {
  return repository.findByDeckId(deckId);
}
