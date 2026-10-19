import type { DecklyDatabase } from "../../db/database";

export type RatingDistribution = Record<0 | 1 | 2 | 3 | 4 | 5, number>;

export interface DashboardStats {
  totalDecks: number;
  totalCards: number;
  dueCards: number;
  reviewsToday: number;
  averageRating: number;
  ratingDistribution: RatingDistribution;
}

function getDayBoundaries(now: Date): [string, string] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [start.toISOString(), end.toISOString()];
}

export function createStatisticsRepository(db: DecklyDatabase) {
  return {
    async getDashboardStats(now: Date): Promise<DashboardStats> {
      const [dayStart, nextDay] = getDayBoundaries(now);
      const [totalDecks, totalCards, dueCards, reviewsToday, reviews] =
        await Promise.all([
          db.decks.count(),
          db.cards.count(),
          db.cards.where("dueAt").belowOrEqual(now.toISOString()).count(),
          db.reviews
            .where("reviewedAt")
            .between(dayStart, nextDay, true, false)
            .count(),
          db.reviews.toArray(),
        ]);

      const ratingDistribution: RatingDistribution = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
      let total = 0;
      for (const review of reviews) {
        total += review.rating;
        if (review.rating in ratingDistribution) {
          ratingDistribution[review.rating as keyof RatingDistribution] += 1;
        }
      }

      return {
        totalDecks,
        totalCards,
        dueCards,
        reviewsToday,
        averageRating: reviews.length === 0 ? 0 : total / reviews.length,
        ratingDistribution,
      };
    },
  };
}
