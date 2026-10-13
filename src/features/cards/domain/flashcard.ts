export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  frontAudioUri?: string | null;
  /** Nome do arquivo de áudio esperado numa importação (não é salvo no banco). */
  frontAudioFile?: string | null;
  /** Áudio embutido (base64) em arquivos exportados pelo Deckly. */
  frontAudioData?: string | null;
  dueAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  intervalMinutes?: number;
  schedulerAlgorithm?: "sm-2" | "fsrs";
  fsrsStability?: number;
  fsrsDifficulty?: number;
  fsrsState?: number;
  fsrsLapses?: number;
  fsrsLearningSteps?: number;
  fsrsLastReviewAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashcardInput {
  front: string;
  back: string;
  frontAudioUri?: string | null;
}

export interface FlashcardRepository {
  save(card: Flashcard): Promise<void>;
  findByDeckId(deckId: string): Promise<Flashcard[]>;
  update(card: Flashcard): Promise<void>;
  remove(id: string): Promise<void>;
  moveToDeck(id: string, deckId: string, updatedAt: string): Promise<void>;
}
