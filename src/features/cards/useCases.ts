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
    throw new Error("A frente do cartão não pode ficar vazia");
  }

  if (!back) {
    throw new Error("O verso do cartão não pode ficar vazio");
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

export async function updateFlashcard(
  repository: FlashcardRepository,
  currentCard: Flashcard,
  input: CreateFlashcardInput,
  updatedAt: Date,
): Promise<Flashcard> {
  const front = input.front.trim();
  const back = input.back.trim();

  if (!front) {
    throw new Error("A frente do cartão não pode ficar vazia");
  }

  if (!back) {
    throw new Error("O verso do cartão não pode ficar vazio");
  }

  const card: Flashcard = {
    ...currentCard,
    front,
    back,
    updatedAt: updatedAt.toISOString(),
  };

  await repository.update(card);
  return card;
}

export function deleteFlashcard(
  repository: FlashcardRepository,
  id: string,
): Promise<void> {
  return repository.remove(id);
}

export async function moveFlashcard(
  repository: FlashcardRepository,
  card: Flashcard,
  targetDeckId: string,
  now: Date,
): Promise<Flashcard> {
  if (card.deckId === targetDeckId) {
    throw new Error("O cartão já está neste baralho");
  }

  const movedCard: Flashcard = {
    ...card,
    deckId: targetDeckId,
    updatedAt: now.toISOString(),
  };

  await repository.moveToDeck(card.id, targetDeckId, movedCard.updatedAt);
  return movedCard;
}
