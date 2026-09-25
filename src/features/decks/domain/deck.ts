export interface Deck {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckInput {
  name: string;
  description?: string;
}

export interface DeckRepository {
  save(deck: Deck): Promise<void>;
  findAll(): Promise<Deck[]>;
  update(deck: Deck): Promise<void>;
  remove(id: string): Promise<void>;
}
