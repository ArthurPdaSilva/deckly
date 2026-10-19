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
  group_id: string | null;
  sort_order: number;
}

export function createDeckRepository(database: DeckDatabase): DeckRepository {
  return {
    async save(deck) {
      await database.runAsync(
        `INSERT INTO decks (
          id, name, description, group_id, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        deck.id,
        deck.name,
        deck.description,
        deck.groupId ?? null,
        deck.sortOrder ?? 0,
        deck.createdAt,
        deck.updatedAt,
      );
    },

    async findAll() {
      const rows = await database.getAllAsync<DeckRow>(
        `SELECT id, name, description, group_id, sort_order,
                created_at, updated_at
         FROM decks
         ORDER BY sort_order ASC, updated_at DESC`,
      );

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        groupId: row.group_id,
        sortOrder: row.sort_order,
      }));
    },

    async update(deck) {
      await database.runAsync(
        `UPDATE decks
         SET name = ?, description = ?, group_id = ?, sort_order = ?, updated_at = ?
         WHERE id = ?`,
        deck.name,
        deck.description,
        deck.groupId ?? null,
        deck.sortOrder ?? 0,
        deck.updatedAt,
        deck.id,
      );
    },

    async remove(id) {
      await database.runAsync("DELETE FROM decks WHERE id = ?", id);
    },
  };
}
