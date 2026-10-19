import type { SQLiteBindValue } from "expo-sqlite";
import type { DeckGroup, DeckGroupRepository } from "./domain/deckGroup";

export interface DeckGroupDatabase {
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: SQLiteBindValue[]): Promise<T[]>;
}

interface DeckGroupRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

function mapGroup(row: DeckGroupRow): DeckGroup {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sortOrder: row.sort_order,
  };
}

export function createDeckGroupRepository(
  database: DeckGroupDatabase,
): DeckGroupRepository {
  return {
    async save(group) {
      await database.runAsync(
        `INSERT INTO deck_groups (
          id, name, created_at, updated_at, sort_order
        ) VALUES (?, ?, ?, ?, ?)`,
        group.id,
        group.name,
        group.createdAt,
        group.updatedAt,
        group.sortOrder,
      );
    },

    async findAll() {
      const rows = await database.getAllAsync<DeckGroupRow>(
        `SELECT id, name, created_at, updated_at, sort_order
         FROM deck_groups ORDER BY sort_order ASC, name ASC`,
      );
      return rows.map(mapGroup);
    },

    async update(group) {
      await database.runAsync(
        `UPDATE deck_groups
         SET name = ?, updated_at = ?, sort_order = ?
         WHERE id = ?`,
        group.name,
        group.updatedAt,
        group.sortOrder,
        group.id,
      );
    },

    async remove(id) {
      await database.runAsync("DELETE FROM deck_groups WHERE id = ?", id);
    },
  };
}
