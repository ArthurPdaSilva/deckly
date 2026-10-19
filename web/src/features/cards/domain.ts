export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  /** Nome do arquivo de áudio da pergunta (o conteúdo fica na tabela `audios`). */
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

export interface CardInput {
  front: string;
  back: string;
}

/**
 * Áudio da pergunta. Os bytes ficam num ArrayBuffer (e não num Blob) porque o
 * IndexedDB trata esse formato de forma idêntica em todos os navegadores.
 */
export interface StoredAudio {
  cardId: string;
  name: string;
  type: string;
  data: ArrayBuffer;
}

export interface FlashcardRepository {
  save(card: Flashcard): Promise<void>;
  findByDeckId(deckId: string): Promise<Flashcard[]>;
  findById(id: string): Promise<Flashcard | undefined>;
  update(card: Flashcard): Promise<void>;
  remove(id: string): Promise<void>;
  moveToDeck(id: string, deckId: string, updatedAt: string): Promise<void>;
  saveAudio(audio: StoredAudio): Promise<void>;
  findAudio(cardId: string): Promise<StoredAudio | undefined>;
  removeAudio(cardId: string): Promise<void>;
}
