import type { Flashcard } from "../cards/domain/flashcard";
import type { Deck } from "../decks/domain/deck";

export interface ExportReview {
  id: string;
  cardId: string;
  reviewedAt: string;
  rating: number;
  previousIntervalDays: number;
  nextIntervalDays: number;
  algorithm: string;
  algorithmVersion: string;
}

export interface ExportCollections {
  decks: Deck[];
  cards: Flashcard[];
  reviews: ExportReview[];
}

export interface DecklyExport extends ExportCollections {
  format: "deckly";
  version: 1;
  exportedAt: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string";
}

function hasNumber(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "number" && Number.isFinite(value[key]);
}

function isDeck(value: unknown): value is Deck {
  return (
    isObject(value) &&
    hasString(value, "id") &&
    hasString(value, "name") &&
    hasString(value, "description") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt")
  );
}

function isCard(value: unknown): value is Flashcard {
  return (
    isObject(value) &&
    hasString(value, "id") &&
    hasString(value, "deckId") &&
    hasString(value, "front") &&
    hasString(value, "back") &&
    hasString(value, "dueAt") &&
    hasNumber(value, "intervalDays") &&
    hasNumber(value, "easeFactor") &&
    hasNumber(value, "repetitions") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt")
  );
}

function isReview(value: unknown): value is ExportReview {
  return (
    isObject(value) &&
    hasString(value, "id") &&
    hasString(value, "cardId") &&
    hasString(value, "reviewedAt") &&
    hasNumber(value, "rating") &&
    hasNumber(value, "previousIntervalDays") &&
    hasNumber(value, "nextIntervalDays") &&
    hasString(value, "algorithm") &&
    hasString(value, "algorithmVersion")
  );
}

export function serializeExportData(
  data: ExportCollections,
  exportedAt: string,
): string {
  const payload: DecklyExport = {
    format: "deckly",
    version: 1,
    exportedAt,
    ...data,
  };

  return JSON.stringify(payload, null, 2);
}

export function parseExportData(input: string): DecklyExport {
  let value: unknown;

  try {
    value = JSON.parse(input);
  } catch {
    throw new Error("Arquivo Deckly inválido");
  }

  if (
    !isObject(value) ||
    value.format !== "deckly" ||
    value.version !== 1 ||
    !hasString(value, "exportedAt") ||
    !Array.isArray(value.decks) ||
    !Array.isArray(value.cards) ||
    !Array.isArray(value.reviews) ||
    !value.decks.every(isDeck) ||
    !value.cards.every(isCard) ||
    !value.reviews.every(isReview)
  ) {
    throw new Error("Arquivo Deckly inválido");
  }

  const deckIds = new Set(value.decks.map((deck) => deck.id));
  if (value.cards.some((card) => !deckIds.has(card.deckId))) {
    throw new Error("Arquivo Deckly contém cartão com baralho inexistente");
  }

  const cardIds = new Set(value.cards.map((card) => card.id));
  if (value.reviews.some((review) => !cardIds.has(review.cardId))) {
    throw new Error("Arquivo Deckly contém revisão com cartão inexistente");
  }

  return value as unknown as DecklyExport;
}
