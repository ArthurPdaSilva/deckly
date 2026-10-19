import type { Flashcard } from "../cards/domain";
import type { Deck, DeckGroup } from "../decks/domain";
import type { ReviewEntry } from "../review/domain";

export type ExportReview = ReviewEntry;
export type ExportGroup = DeckGroup;

export interface ExportCollections {
  groups?: ExportGroup[];
  decks: Deck[];
  cards: Flashcard[];
  reviews: ExportReview[];
}

/** Preferências de estudo que acompanham o backup da web (campo opcional). */
export interface ExportSettings {
  algorithm: "sm-2" | "fsrs";
  desiredRetention: number;
}

export interface DecklyExport extends ExportCollections {
  format: "deckly";
  version: 1;
  exportedAt: string;
  settings?: ExportSettings;
}

export const INVALID_FILE_MESSAGE = "Arquivo Deckly inválido";

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

function isGroup(value: unknown): value is ExportGroup {
  return (
    isObject(value) &&
    hasString(value, "id") &&
    hasString(value, "name") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt") &&
    hasNumber(value, "sortOrder")
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
    (value.previousIntervalMinutes === undefined ||
      hasNumber(value, "previousIntervalMinutes")) &&
    (value.nextIntervalMinutes === undefined ||
      hasNumber(value, "nextIntervalMinutes")) &&
    hasString(value, "algorithm") &&
    hasString(value, "algorithmVersion")
  );
}

function isSettings(value: unknown): value is ExportSettings {
  return (
    isObject(value) &&
    (value.algorithm === "sm-2" || value.algorithm === "fsrs") &&
    hasNumber(value, "desiredRetention")
  );
}

export function serializeExportData(
  data: ExportCollections,
  exportedAt: string,
  settings?: ExportSettings,
): string {
  const payload: DecklyExport = {
    format: "deckly",
    version: 1,
    exportedAt,
    ...data,
    ...(settings ? { settings } : {}),
  };

  return JSON.stringify(payload, null, 2);
}

export function parseExportData(input: string): DecklyExport {
  let value: unknown;

  try {
    value = JSON.parse(input);
  } catch {
    throw new Error(INVALID_FILE_MESSAGE);
  }

  if (
    !isObject(value) ||
    value.format !== "deckly" ||
    value.version !== 1 ||
    !hasString(value, "exportedAt") ||
    (value.settings !== undefined && !isSettings(value.settings)) ||
    (value.groups !== undefined &&
      (!Array.isArray(value.groups) || !value.groups.every(isGroup))) ||
    !Array.isArray(value.decks) ||
    !Array.isArray(value.cards) ||
    !Array.isArray(value.reviews) ||
    !value.decks.every(isDeck) ||
    !value.cards.every(isCard) ||
    !value.reviews.every(isReview)
  ) {
    throw new Error(INVALID_FILE_MESSAGE);
  }

  const deckIds = new Set(value.decks.map((deck) => deck.id));
  const groupIds = new Set((value.groups ?? []).map((group) => group.id));
  if (value.decks.some((deck) => deck.groupId && !groupIds.has(deck.groupId))) {
    throw new Error("Arquivo Deckly contém baralho com grupo inexistente");
  }
  if (value.cards.some((card) => !deckIds.has(card.deckId))) {
    throw new Error("Arquivo Deckly contém cartão com baralho inexistente");
  }

  const cardIds = new Set(value.cards.map((card) => card.id));
  if (value.reviews.some((review) => !cardIds.has(review.cardId))) {
    throw new Error("Arquivo Deckly contém revisão com cartão inexistente");
  }

  return value as unknown as DecklyExport;
}
