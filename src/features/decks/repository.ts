import type { SQLiteBindValue } from "expo-sqlite";
import type { DeckRepository } from "./domain/deck";

export interface DeckDatabase {
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: SQLiteBindValue[]): Promise<T[]>;
}

interface DeckRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function createDeckRepository(database: DeckDatabase): DeckRepository {
  return {
    async save(deck) {
      await database.runAsync(
        `INSERT INTO decks (
          id, name, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)`,
        deck.id,
        deck.name,
        deck.description,
        deck.createdAt,
        deck.updatedAt,
      );
    },

    async findAll() {
      const rows = await database.getAllAsync<DeckRow>(
        `SELECT id, name, description, created_at, updated_at
         FROM decks
         ORDER BY updated_at DESC`,
      );

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },

    async update(deck) {
      await database.runAsync(
        `UPDATE decks
         SET name = ?, description = ?, updated_at = ?
         WHERE id = ?`,
        deck.name,
        deck.description,
        deck.updatedAt,
        deck.id,
      );
    },

    async remove(id) {
      await database.runAsync("DELETE FROM decks WHERE id = ?", id);
    },
  };
}
