import type {
  ReviewRecord,
  ReviewState,
} from "../../../features/review/domain/scheduler";
import { createReviewRepository } from "../../../features/review/repository";

const reviewState: ReviewState = {
  dueAt: "2026-03-02T10:00:00.000Z",
  intervalDays: 1,
  easeFactor: 2.6,
  repetitions: 1,
};

const review: ReviewRecord = {
  reviewedAt: "2026-03-01T10:00:00.000Z",
  rating: 5,
  previousIntervalDays: 0,
  nextIntervalDays: 1,
  algorithm: "sm-2",
  algorithmVersion: "1",
};

describe("SQLite review repository", () => {
  it("finds cards due at the requested time", async () => {
    const row = {
      id: "card-1",
      deck_id: "deck-1",
      front: "Hello",
      back: "Olá",
      due_at: "2026-03-01T09:00:00.000Z",
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      created_at: "2026-02-01T10:00:00.000Z",
      updated_at: "2026-02-01T10:00:00.000Z",
    };
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([row]),
    };
    const repository = createReviewRepository(database);

    await expect(
      repository.findDueCards("2026-03-01T10:00:00.000Z"),
    ).resolves.toEqual([
      expect.objectContaining({ id: "card-1", deckId: "deck-1" }),
    ]);
    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE due_at <= ?"),
      ["2026-03-01T10:00:00.000Z"],
    );
  });

  it("filters due cards by deck when requested", async () => {
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };

    await createReviewRepository(database).findDueCards(
      "2026-03-01T10:00:00.000Z",
      "deck-1",
    );

    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("AND deck_id = ?"),
      ["2026-03-01T10:00:00.000Z", "deck-1"],
    );
  });

  it("updates the card and records its review in one transaction", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn(),
    };
    const repository = createReviewRepository(database);

    await repository.recordReview("card-1", "review-1", reviewState, review);

    expect(database.runAsync).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE cards"),
      reviewState.dueAt,
      reviewState.intervalDays,
      1440,
      reviewState.easeFactor,
      reviewState.repetitions,
      "sm-2",
      0,
      0,
      0,
      0,
      review.reviewedAt,
      "card-1",
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO review_history"),
      "review-1",
      "card-1",
      review.reviewedAt,
      review.rating,
      review.previousIntervalDays,
      review.nextIntervalDays,
      0,
      1440,
      review.algorithm,
      review.algorithmVersion,
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(4, "COMMIT");
  });

  it("finds due cards from every deck in a group", async () => {
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "card-1",
          deck_id: "deck-1",
          front: "Hello",
          back: "Olá",
          due_at: "2026-03-01T10:00:00.000Z",
          interval_days: 0,
          interval_minutes: 0,
          ease_factor: 2.5,
          repetitions: 0,
          scheduler_algorithm: "sm-2",
          fsrs_stability: 0,
          fsrs_difficulty: 0,
          fsrs_state: 0,
          fsrs_lapses: 0,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      ]),
    };

    const cards = await createReviewRepository(database).findDueCards(
      "2026-03-02T10:00:00.000Z",
      undefined,
      "group-1",
    );

    expect(cards).toHaveLength(1);
    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("d.group_id = ?"),
      ["2026-03-02T10:00:00.000Z", "group-1"],
    );
  });
});
