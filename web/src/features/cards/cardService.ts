import { audioMimeType } from "../../lib/base64";
import { readAsArrayBuffer } from "../../lib/files";
import type { CardInput, Flashcard, FlashcardRepository } from "./domain";

export interface CreateFlashcardOptions {
  now: Date;
  createId: () => string;
}

function normalize(input: CardInput): CardInput {
  const front = input.front.trim();
  const back = input.back.trim();

  if (!front) throw new Error("A frente do cartão não pode ficar vazia");
  if (!back) throw new Error("O verso do cartão não pode ficar vazio");

  return { front, back };
}

export async function createFlashcard(
  repository: FlashcardRepository,
  deckId: string,
  input: CardInput,
  options: CreateFlashcardOptions,
): Promise<Flashcard> {
  const { front, back } = normalize(input);
  const timestamp = options.now.toISOString();
  const card: Flashcard = {
    id: options.createId(),
    deckId,
    front,
    back,
    frontAudioUri: null,
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
  input: CardInput,
  updatedAt: Date,
): Promise<Flashcard> {
  const { front, back } = normalize(input);
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

export async function attachCardAudio(
  repository: FlashcardRepository,
  card: Flashcard,
  file: { name: string; blob: Blob },
  now: Date,
): Promise<Flashcard> {
  await repository.saveAudio({
    cardId: card.id,
    name: file.name,
    type: file.blob.type || audioMimeType(file.name),
    data: await readAsArrayBuffer(file.blob),
  });

  const updated: Flashcard = {
    ...card,
    frontAudioUri: file.name,
    updatedAt: now.toISOString(),
  };
  await repository.update(updated);
  return updated;
}

export async function removeCardAudio(
  repository: FlashcardRepository,
  card: Flashcard,
  now: Date,
): Promise<Flashcard> {
  await repository.removeAudio(card.id);
  const updated: Flashcard = {
    ...card,
    frontAudioUri: null,
    updatedAt: now.toISOString(),
  };
  await repository.update(updated);
  return updated;
}
