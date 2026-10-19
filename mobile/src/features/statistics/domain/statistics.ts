export type RatingDistribution = Record<0 | 1 | 2 | 3 | 4 | 5, number>;

export interface DashboardStats {
  totalDecks: number;
  totalCards: number;
  dueCards: number;
  reviewsToday: number;
  averageRating: number;
  ratingDistribution: RatingDistribution;
}
