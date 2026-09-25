import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { type MigrationDatabase, runMigrations } from "./migrations";

export const DATABASE_NAME = "deckly.db";

function asMigrationDatabase(database: SQLiteDatabase): MigrationDatabase {
  return {
    execAsync: (sql) => database.execAsync(sql),
    getFirstAsync: <T>(sql: string) => database.getFirstAsync<T>(sql),
  };
}

export async function initializeDatabase(
  database: SQLiteDatabase,
): Promise<void> {
  await database.execAsync("PRAGMA foreign_keys = ON");
  await runMigrations(asMigrationDatabase(database));
}

export async function openDecklyDatabase(): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(DATABASE_NAME);

  await initializeDatabase(database);

  return database;
}
