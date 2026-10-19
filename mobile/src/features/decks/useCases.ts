import type { CreateDeckInput, Deck, DeckRepository } from "./domain/deck";

export interface CreateDeckOptions {
  now: Date;
  createId: () => string;
}

export async function createDeck(
  repository: DeckRepository,
  input: CreateDeckInput,
  options: CreateDeckOptions,
): Promise<Deck> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("O nome do baralho não pode ficar vazio");
  }

  const timestamp = options.now.toISOString();
  const deck: Deck = {
    id: options.createId(),
    name,
    description: input.description?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(input.groupId !== undefined ? { groupId: input.groupId } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
  };

  await repository.save(deck);
  return deck;
}

export function listDecks(repository: DeckRepository): Promise<Deck[]> {
  return repository.findAll();
}

export async function updateDeck(
  repository: DeckRepository,
  currentDeck: Deck,
  input: CreateDeckInput,
  updatedAt: Date,
): Promise<Deck> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("O nome do baralho não pode ficar vazio");
  }

  const deck: Deck = {
    ...currentDeck,
    name,
    description: input.description?.trim() ?? currentDeck.description,
    updatedAt: updatedAt.toISOString(),
  };

  await repository.update(deck);
  return deck;
}

export function deleteDeck(
  repository: DeckRepository,
  id: string,
): Promise<void> {
  return repository.remove(id);
}
