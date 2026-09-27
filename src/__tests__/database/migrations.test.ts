import {
  getPendingMigrations,
  type MigrationDatabase,
  runMigrations,
} from "../../database/migrations";

function createDatabase(currentVersion: number): MigrationDatabase & {
  executed: string[];
} {
  return {
    executed: [],
    async execAsync(sql: string) {
      this.executed.push(sql);
    },
    async getFirstAsync<T>() {
      return { user_version: currentVersion } as T;
    },
  };
}

describe("database migrations", () => {
  it("returns migrations newer than the local schema version", () => {
    const pending = getPendingMigrations(0);

    expect(pending.length).toBeGreaterThan(0);
    expect(pending.map((migration) => migration.version)).toEqual(
      [...pending.map((migration) => migration.version)].sort(
        (first, second) => first - second,
      ),
    );
  });

  it("runs pending migrations in a transaction and updates the schema version", async () => {
    const database = createDatabase(0);

    await runMigrations(database);

    expect(database.executed[0]).toBe("BEGIN");
    expect(database.executed).toContainEqual(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS decks"),
    );
    expect(database.executed).toContainEqual(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS cards"),
    );
    expect(database.executed.at(-2)).toMatch(/^PRAGMA user_version = \d+$/);
    expect(database.executed.at(-1)).toBe("COMMIT");
  });

  it("does not execute anything when the schema is up to date", async () => {
    const database = createDatabase(3);

    await runMigrations(database);

    expect(database.executed).toEqual([]);
  });

  it("adds nullable deck groups without changing existing deck ownership", () => {
    const migration = getPendingMigrations(2).find(
      (item) => item.version === 3,
    );

    expect(migration?.statements).toEqual(
      expect.arrayContaining([
        expect.stringContaining("CREATE TABLE IF NOT EXISTS deck_groups"),
        expect.stringContaining("ALTER TABLE decks ADD COLUMN group_id"),
        expect.stringContaining("ALTER TABLE decks ADD COLUMN sort_order"),
      ]),
    );
  });
});
