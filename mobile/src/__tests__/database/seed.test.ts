import {
  resetAndSeedDatabase,
  SEED_CARDS,
  SEED_DECKS,
  SEED_GROUPS,
} from "../../database/seed";

describe("development database seed", () => {
  it("contains several decks and enough unique cards for manual testing", () => {
    expect(SEED_DECKS.length).toBeGreaterThanOrEqual(5);
    expect(SEED_GROUPS.length).toBeGreaterThanOrEqual(3);
    expect(SEED_CARDS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SEED_DECKS.map((deck) => deck.id)).size).toBe(
      SEED_DECKS.length,
    );
    expect(SEED_DECKS.some((deck) => deck.groupId === null)).toBe(true);
    expect(new Set(SEED_CARDS.map((card) => card.id)).size).toBe(
      SEED_CARDS.length,
    );
    expect(
      new Set(SEED_CARDS.map((card) => card.deckId)).size,
    ).toBeGreaterThanOrEqual(5);
    expect(SEED_CARDS.some((card) => card.repetitions > 0)).toBe(true);
    expect(SEED_CARDS.some((card) => card.intervalDays > 0)).toBe(true);
  });

  it("clears existing data and inserts deterministic test data in a transaction", async () => {
    const database = {
      executed: [] as string[],
      async execAsync(sql: string) {
        this.executed.push(sql);
      },
    };

    await resetAndSeedDatabase(database);

    expect(database.executed[0]).toBe("BEGIN");
    expect(database.executed).toContain("DELETE FROM review_history");
    expect(database.executed).toContain("DELETE FROM cards");
    expect(database.executed).toContain("DELETE FROM decks");
    expect(database.executed).toContain("DELETE FROM deck_groups");
    expect(database.executed).toContainEqual(
      expect.stringContaining(SEED_DECKS[0].id),
    );
    expect(database.executed).toContainEqual(
      expect.stringContaining(SEED_GROUPS[0].id),
    );
    expect(database.executed).toContainEqual(
      expect.stringContaining(SEED_CARDS[0].id),
    );
    expect(database.executed.at(-1)).toBe("COMMIT");
  });

  it("rolls back when the seed cannot be applied", async () => {
    const database = {
      executed: [] as string[],
      async execAsync(sql: string) {
        this.executed.push(sql);
        if (sql === "DELETE FROM cards") {
          throw new Error("seed failed");
        }
      },
    };

    await expect(resetAndSeedDatabase(database)).rejects.toThrow("seed failed");
    expect(database.executed.at(-1)).toBe("ROLLBACK");
  });
});
