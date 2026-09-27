export interface DeckGroup {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
}

export interface DeckGroupRepository {
  save(group: DeckGroup): Promise<void>;
  findAll(): Promise<DeckGroup[]>;
  update(group: DeckGroup): Promise<void>;
  remove(id: string): Promise<void>;
}
