import type {
  CreateDeckInput,
  Deck,
  DeckGroup,
  DeckGroupRepository,
  DeckRepository,
} from "./domain";

export interface CreateOptions {
  now: Date;
  createId: () => string;
}

export async function createDeck(
  repository: DeckRepository,
  input: CreateDeckInput,
  options: CreateOptions,
): Promise<Deck> {
  const name = input.name.trim();
  if (!name) throw new Error("O nome do baralho não pode ficar vazio");

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
  if (!name) throw new Error("O nome do baralho não pode ficar vazio");

  const deck: Deck = {
    ...currentDeck,
    name,
    description: input.description?.trim() ?? currentDeck.description,
    groupId: input.groupId === undefined ? currentDeck.groupId : input.groupId,
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

export async function moveDeck(
  repository: DeckRepository,
  deck: Deck,
  groupId: string | null,
  sortOrder: number,
  now: Date,
): Promise<Deck> {
  const updated = { ...deck, groupId, sortOrder, updatedAt: now.toISOString() };
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

export async function createDeckGroup(
  repository: DeckGroupRepository,
  nameInput: string,
  options: CreateOptions & { sortOrder: number },
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
