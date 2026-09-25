import type { SQLiteBindValue } from "expo-sqlite";
import type { DashboardStats, RatingDistribution } from "./domain/statistics";

export interface StatisticsDatabase {
  getFirstAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params: SQLiteBindValue[]): Promise<T[]>;
}

interface CountRow {
  count: number;
}

interface AverageRow {
  average: number | null;
}

interface RatingRow {
  rating: number;
  count: number;
}

const RATINGS = [0, 1, 2, 3, 4, 5] as const;

function createEmptyDistribution(): RatingDistribution {
  return { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function getDayBoundaries(now: Date): [string, string] {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return [start.toISOString(), end.toISOString()];
}

export function createStatisticsRepository(database: StatisticsDatabase) {
  return {
    async getDashboardStats(now: Date): Promise<DashboardStats> {
      const [dayStart, nextDay] = getDayBoundaries(now);
      const [decks, cards, dueCards, reviewsToday, average, ratings] =
        await Promise.all([
          database.getFirstAsync<CountRow>(
            "SELECT COUNT(*) AS count FROM decks",
            [],
          ),
          database.getFirstAsync<CountRow>(
            "SELECT COUNT(*) AS count FROM cards",
            [],
          ),
          database.getFirstAsync<CountRow>(
            "SELECT COUNT(*) AS count FROM cards WHERE due_at <= ?",
            [now.toISOString()],
          ),
          database.getFirstAsync<CountRow>(
            "SELECT COUNT(*) AS count FROM review_history WHERE reviewed_at >= ? AND reviewed_at < ?",
            [dayStart, nextDay],
          ),
          database.getFirstAsync<AverageRow>(
            "SELECT AVG(rating) AS average FROM review_history",
            [],
          ),
          database.getAllAsync<RatingRow>(
            "SELECT rating, COUNT(*) AS count FROM review_history GROUP BY rating",
            [],
          ),
        ]);

      const ratingDistribution = createEmptyDistribution();
      for (const row of ratings) {
        if (RATINGS.includes(row.rating as (typeof RATINGS)[number])) {
          ratingDistribution[row.rating as (typeof RATINGS)[number]] =
            row.count;
        }
      }

      return {
        totalDecks: decks?.count ?? 0,
        totalCards: cards?.count ?? 0,
        dueCards: dueCards?.count ?? 0,
        reviewsToday: reviewsToday?.count ?? 0,
        averageRating: average?.average ?? 0,
        ratingDistribution,
      };
    },
  };
}
