import { DecklyDatabase } from "../db/database";
import type { FlashcardRepository } from "../features/cards/domain";
import { createFlashcardRepository } from "../features/cards/repository";
import { createDataTransferRepository } from "../features/dataTransfer/repository";
import type {
  DeckGroupRepository,
  DeckRepository,
} from "../features/decks/domain";
import {
  createDeckGroupRepository,
  createDeckRepository,
} from "../features/decks/repository";
import {
  createAlgorithmRepository,
  createReviewRepository,
} from "../features/review/repository";
import { createStatisticsRepository } from "../features/statistics/repository";
import { createId } from "../lib/id";

export interface Services {
  db: DecklyDatabase;
  now: () => Date;
  createId: () => string;
  groups: DeckGroupRepository;
  decks: DeckRepository;
  cards: FlashcardRepository;
  reviews: ReturnType<typeof createReviewRepository>;
  algorithm: ReturnType<typeof createAlgorithmRepository>;
  statistics: ReturnType<typeof createStatisticsRepository>;
  dataTransfer: ReturnType<typeof createDataTransferRepository>;
}

export interface ServicesOptions {
  db?: DecklyDatabase;
  now?: () => Date;
  createId?: () => string;
}

/** Monta os repositórios sobre um banco; os testes passam um banco isolado. */
export function createServices(options: ServicesOptions = {}): Services {
  const db = options.db ?? new DecklyDatabase();

  return {
    db,
    now: options.now ?? (() => new Date()),
    createId: options.createId ?? createId,
    groups: createDeckGroupRepository(db),
    decks: createDeckRepository(db),
    cards: createFlashcardRepository(db),
    reviews: createReviewRepository(db),
    algorithm: createAlgorithmRepository(db),
    statistics: createStatisticsRepository(db),
    dataTransfer: createDataTransferRepository(db),
  };
}
