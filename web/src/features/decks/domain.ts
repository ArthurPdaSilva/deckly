export interface DeckGroup {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  groupId?: string | null;
  sortOrder?: number;
}

export interface CreateDeckInput {
  name: string;
  description?: string;
  groupId?: string | null;
  sortOrder?: number;
}

export interface DeckGroupRepository {
  save(group: DeckGroup): Promise<void>;
  findAll(): Promise<DeckGroup[]>;
  update(group: DeckGroup): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface DeckRepository {
  save(deck: Deck): Promise<void>;
  findAll(): Promise<Deck[]>;
  update(deck: Deck): Promise<void>;
  remove(id: string): Promise<void>;
}
