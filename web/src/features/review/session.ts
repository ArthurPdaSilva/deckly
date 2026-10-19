import type { Flashcard } from "../cards/domain";
import type { ReviewState } from "./domain";

/** Cartões cuja próxima revisão cai nesta janela voltam para a mesma sessão. */
export const REQUEUE_WINDOW_MS = 20 * 60_000;

/** Nota enviada ao agendador para cada botão de avaliação. */
export const RATING_BUTTONS = [
  { key: "again", rating: 2, color: "bg-rating-again" },
  { key: "hard", rating: 3, color: "bg-rating-hard" },
  { key: "good", rating: 4, color: "bg-rating-good" },
  { key: "easy", rating: 5, color: "bg-rating-easy" },
] as const;

export function toReviewState(card: Flashcard): ReviewState {
  return {
    dueAt: card.dueAt,
    intervalDays: card.intervalDays,
    easeFactor: card.easeFactor,
    repetitions: card.repetitions,
    intervalMinutes: card.intervalMinutes,
    schedulerAlgorithm: card.schedulerAlgorithm,
    fsrsStability: card.fsrsStability,
    fsrsDifficulty: card.fsrsDifficulty,
    fsrsState: card.fsrsState,
    fsrsLapses: card.fsrsLapses,
    fsrsLearningSteps: card.fsrsLearningSteps,
    fsrsLastReviewAt: card.fsrsLastReviewAt,
  };
}

/**
 * Remove o cartão avaliado da fila. Se a próxima revisão for em breve e ainda
 * houver outros cartões, ele volta ao fim da fila; senão espera a próxima sessão.
 */
export function advanceQueue(
  queue: Flashcard[],
  nextState: ReviewState,
  reviewedAt: Date,
): Flashcard[] {
  const [card, ...remaining] = queue;
  if (!card) return queue;

  const dueInMs = new Date(nextState.dueAt).getTime() - reviewedAt.getTime();
  if (dueInMs > REQUEUE_WINDOW_MS || remaining.length === 0) {
    return remaining;
  }

  return [...remaining, { ...card, ...nextState }];
}
