export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashcardInput {
  front: string;
  back: string;
}

export interface FlashcardRepository {
  save(card: Flashcard): Promise<void>;
  findByDeckId(deckId: string): Promise<Flashcard[]>;
}
