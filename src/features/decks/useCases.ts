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
    throw new Error("Deck name cannot be empty");
  }

  const timestamp = options.now.toISOString();
  const deck: Deck = {
    id: options.createId(),
    name,
    description: input.description?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await repository.save(deck);
  return deck;
}

export function listDecks(repository: DeckRepository): Promise<Deck[]> {
  return repository.findAll();
}
