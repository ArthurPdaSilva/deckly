import type { Deck, DeckRepository } from "./domain/deck";
import type { DeckGroup, DeckGroupRepository } from "./domain/deckGroup";

export interface CreateDeckGroupOptions {
  now: Date;
  createId: () => string;
  sortOrder: number;
}

export async function createDeckGroup(
  repository: DeckGroupRepository,
  nameInput: string,
  options: CreateDeckGroupOptions,
): Promise<DeckGroup> {
  const name = nameInput.trim();
  if (!name) throw new Error("O nome do grupo não pode ficar vazio");

  const timestamp = options.now.toISOString();
  const group: DeckGroup = {
    id: options.createId(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    sortOrder: options.sortOrder,
  };
  await repository.save(group);
  return group;
}

export async function renameDeckGroup(
  repository: DeckGroupRepository,
  group: DeckGroup,
  nameInput: string,
  now: Date,
): Promise<DeckGroup> {
  const name = nameInput.trim();
  if (!name) throw new Error("O nome do grupo não pode ficar vazio");
  const updated = { ...group, name, updatedAt: now.toISOString() };
  await repository.update(updated);
  return updated;
}

export async function moveDeck(
  repository: DeckRepository,
  deck: Deck,
  groupId: string | null,
  sortOrder: number,
  now: Date,
): Promise<Deck> {
  const updated = {
    ...deck,
    groupId,
    sortOrder,
    updatedAt: now.toISOString(),
  };
  await repository.update(updated);
  return updated;
}

export async function reorderDecks(
  repository: DeckRepository,
  decks: Deck[],
  now: Date,
): Promise<void> {
  await Promise.all(
    decks.map((deck, index) =>
      repository.update({
        ...deck,
        sortOrder: index,
        updatedAt: now.toISOString(),
      }),
    ),
  );
}

export async function reorderDeckGroups(
  repository: DeckGroupRepository,
  groups: DeckGroup[],
  now: Date,
): Promise<void> {
  await Promise.all(
    groups.map((group, index) =>
      repository.update({
        ...group,
        sortOrder: index,
        updatedAt: now.toISOString(),
      }),
    ),
  );
}
