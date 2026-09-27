export interface MigrationDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string, params?: readonly unknown[]): Promise<T | null>;
}

export interface DatabaseMigration {
  version: number;
  statements: readonly string[];
}

export const MIGRATIONS: readonly DatabaseMigration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY NOT NULL,
        deck_id TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        due_at TEXT NOT NULL,
        interval_days INTEGER NOT NULL DEFAULT 0,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        repetitions INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS review_history (
        id TEXT PRIMARY KEY NOT NULL,
        card_id TEXT NOT NULL,
        reviewed_at TEXT NOT NULL,
        rating INTEGER NOT NULL,
        previous_interval_days INTEGER NOT NULL,
        next_interval_days INTEGER NOT NULL,
        algorithm TEXT NOT NULL,
        algorithm_version TEXT NOT NULL,
        FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )`,
    ],
  },
  {
    version: 2,
    statements: [
      "ALTER TABLE cards ADD COLUMN interval_minutes INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE cards ADD COLUMN scheduler_algorithm TEXT NOT NULL DEFAULT 'sm-2'",
      "ALTER TABLE cards ADD COLUMN fsrs_stability REAL NOT NULL DEFAULT 0",
      "ALTER TABLE cards ADD COLUMN fsrs_difficulty REAL NOT NULL DEFAULT 0",
      "ALTER TABLE cards ADD COLUMN fsrs_state INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE cards ADD COLUMN fsrs_lapses INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE review_history ADD COLUMN previous_interval_minutes INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE review_history ADD COLUMN next_interval_minutes INTEGER NOT NULL DEFAULT 0",
    ],
  },
  {
    version: 3,
    statements: [
      `CREATE TABLE IF NOT EXISTS deck_groups (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )`,
      "ALTER TABLE decks ADD COLUMN group_id TEXT REFERENCES deck_groups (id) ON DELETE SET NULL",
      "ALTER TABLE decks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
    ],
  },
];

export function getPendingMigrations(
  currentVersion: number,
): readonly DatabaseMigration[] {
  return MIGRATIONS.filter(
    (migration) => migration.version > currentVersion,
  ).sort((first, second) => first.version - second.version);
}

export async function runMigrations(
  database: MigrationDatabase,
): Promise<void> {
  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = versionRow?.user_version ?? 0;
  const pendingMigrations = getPendingMigrations(currentVersion);

  if (pendingMigrations.length === 0) {
    return;
  }

  await database.execAsync("BEGIN");

  try {
    for (const migration of pendingMigrations) {
      for (const statement of migration.statements) {
        await database.execAsync(statement);
      }

      await database.execAsync(`PRAGMA user_version = ${migration.version}`);
    }

    await database.execAsync("COMMIT");
  } catch (error) {
    await database.execAsync("ROLLBACK");
    throw error;
  }
}
