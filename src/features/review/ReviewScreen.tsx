import { useSQLiteContext } from "expo-sqlite";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import type { Flashcard } from "../cards/domain/flashcard";
import type { Deck } from "../decks/domain/deck";
import type { DeckGroup } from "../decks/domain/deckGroup";
import { createAlgorithmRepository } from "./algorithmRepository";
import type { ReviewRating } from "./domain/scheduler";
import { createReviewRepository } from "./repository";
import { createScheduler } from "./schedulerFactory";
import { formatCompactReviewInterval } from "./time";

interface ReviewScreenProps {
  deck?: Deck;
  group?: DeckGroup;
  now?: Date;
  onBack: () => void;
}

export function ReviewScreen({
  deck,
  group,
  now = new Date(),
  onBack,
}: ReviewScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [sessionNow] = useState(() => now ?? new Date());
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [algorithm, setAlgorithm] = useState<"sm-2" | "fsrs">("sm-2");
  const deckId = deck?.id;
  const groupId = group?.id;

  useEffect(() => {
    let mounted = true;
    const repository = createReviewRepository(database);
    const cardsPromise = repository.findDueCards(
      sessionNow.toISOString(),
      deckId,
      groupId,
    );
    void Promise.all([
      cardsPromise,
      createAlgorithmRepository(database).getActiveAlgorithm(),
    ]).then(([dueCards, activeAlgorithm]) => {
      if (mounted) {
        setCards(dueCards);
        setTotalCards(dueCards.length);
        setAlgorithm(activeAlgorithm);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [database, deckId, groupId, sessionNow]);

  async function handleRate(rating: ReviewRating) {
    const card = cards[0];
    if (!card || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = createScheduler(algorithm).schedule(
        {
          dueAt: card.dueAt,
          intervalDays: card.intervalDays,
          easeFactor: card.easeFactor,
          repetitions: card.repetitions,
          intervalMinutes: card.intervalMinutes,
          schedulerAlgorithm: card.schedulerAlgorithm,
          fsrsStability: card.fsrsStability,
          fsrsDifficulty: card.fsrsDifficulty,
          fsrsState: card.fsrsState,
          fsrsLapses: card.fsrsLapses,
        },
        rating,
        sessionNow,
      );
      await createReviewRepository(database).recordReview(
        card.id,
        `review-${Date.now()}`,
        result.nextState,
        result.review,
      );
      setCards((currentCards) => currentCards.slice(1));
      setShowAnswer(false);
      notify.success(t("reviewRegistered"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("reviewError"));
    } finally {
      setIsSaving(false);
    }
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    back: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginBottom: theme.spacing.xl,
    },
    sessionContent: {
      flex: 1,
      justifyContent: "flex-start",
      paddingBottom: theme.spacing.xl,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: theme.typography.bodySmall,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    title: {
      color: theme.colors.text,
      fontSize: 32,
      fontWeight: "700",
      marginTop: theme.spacing.xs,
    },
    progressHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: theme.spacing.lg,
    },
    progress: {
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    progressPercent: {
      color: theme.colors.primary,
      fontWeight: "800",
    },
    sessionEstimate: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      marginTop: theme.spacing.sm,
    },
    progressTrack: {
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: 99,
      height: 8,
      marginTop: theme.spacing.sm,
      overflow: "hidden",
    },
    progressFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 99,
      height: "100%",
    },
    card: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: 24,
      marginTop: theme.spacing.xl,
      padding: theme.spacing.xl,
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    content: {
      color: theme.colors.text,
      fontSize: 24,
      lineHeight: 32,
      marginTop: theme.spacing.md,
    },
    divider: {
      borderColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
    },
    reveal: {
      alignItems: "center",
      borderColor: theme.colors.primary,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    revealLabel: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    controlPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    ratings: {
      flexDirection: "row",
      gap: 6,
      marginTop: theme.spacing.lg,
    },
    rating: {
      alignItems: "center",
      borderRadius: 12,
      flex: 1,
      minHeight: 58,
      paddingHorizontal: 4,
      paddingVertical: 7,
    },
    ratingLabel: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
    },
    ratingContent: {
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    ratingInterval: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
    empty: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      marginTop: theme.spacing.xl,
    },
    loading: {
      alignItems: "center",
      gap: theme.spacing.sm,
      justifyContent: "center",
      marginTop: theme.spacing.xl,
    },
    loadingLabel: {
      color: theme.colors.textSecondary,
    },
    summaryCard: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.primaryMuted,
      borderRadius: 22,
      borderWidth: 1,
      color: theme.colors.text,
      marginTop: theme.spacing.xl,
      padding: theme.spacing.xl,
      textAlign: "center",
    },
    summaryIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.success,
      borderRadius: 99,
      height: 48,
      justifyContent: "center",
      alignSelf: "center",
      width: 48,
    },
    summaryIconLabel: {
      color: theme.colors.onPrimary,
      fontSize: 24,
      fontWeight: "800",
    },
    summaryTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "700",
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    summaryText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      marginTop: theme.spacing.sm,
      textAlign: "center",
    },
    summaryButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    summaryButtonLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "800",
    },
  });

  const currentCard = cards[0];
  const reviewedCount = totalCards - cards.length;
  const progressRatio = totalCards === 0 ? 0 : reviewedCount / totalCards;
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <View testID="review-content" style={styles.sessionContent}>
          <Text style={styles.eyebrow}>
            {deck
              ? `REVISÃO • ${deck.name.toUpperCase()}`
              : group
                ? `GRUPO • ${group.name.toUpperCase()}`
                : t("todaySession").toUpperCase()}
          </Text>
          <Text style={styles.title}>{t("review")}</Text>
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={theme.colors.primary}
                testID="review-loading"
              />
              <Text style={styles.loadingLabel}>{t("reviewPreparing")}</Text>
            </View>
          ) : currentCard ? (
            <>
              <View style={styles.progressHeader}>
                <Text style={styles.progress}>
                  {t("cardProgress", {
                    current: reviewedCount + 1,
                    total: totalCards,
                  })}
                </Text>
                <Text
                  style={styles.progressPercent}
                >{`${progressPercent}%`}</Text>
              </View>
              <Text style={styles.sessionEstimate}>
                {t("estimatedTime", {
                  minutes: Math.max(1, Math.ceil(cards.length * 0.5)),
                })}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  testID="review-progress-fill"
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
              <AnimatedReviewCard key={currentCard.id}>
                <View style={styles.card}>
                  <Text style={styles.label}>{t("front")}</Text>
                  <Text style={styles.content}>{currentCard.front}</Text>
                  {showAnswer ? (
                    <View style={styles.divider}>
                      <Text style={styles.label}>{t("backSide")}</Text>
                      <Text style={styles.content}>{currentCard.back}</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setShowAnswer(true)}
                      style={({ pressed }) => [
                        styles.reveal,
                        pressed && styles.controlPressed,
                      ]}
                    >
                      <Text style={styles.revealLabel}>{t("showAnswer")}</Text>
                    </Pressable>
                  )}
                  {showAnswer ? (
                    <View style={styles.ratings}>
                      {[
                        {
                          label: t("again"),
                          rating: 2 as const,
                          color: theme.colors.ratingAgain,
                        },
                        {
                          label: t("hard"),
                          rating: 3 as const,
                          color: theme.colors.ratingHard,
                        },
                        {
                          label: t("good"),
                          rating: 4 as const,
                          color: theme.colors.ratingGood,
                        },
                        {
                          label: t("easy"),
                          rating: 5 as const,
                          color: theme.colors.ratingEasy,
                        },
                      ].map((option) => {
                        const preview = createScheduler(algorithm).schedule(
                          {
                            dueAt: currentCard.dueAt,
                            intervalDays: currentCard.intervalDays,
                            easeFactor: currentCard.easeFactor,
                            repetitions: currentCard.repetitions,
                            intervalMinutes: currentCard.intervalMinutes,
                            schedulerAlgorithm: currentCard.schedulerAlgorithm,
                            fsrsStability: currentCard.fsrsStability,
                            fsrsDifficulty: currentCard.fsrsDifficulty,
                            fsrsState: currentCard.fsrsState,
                            fsrsLapses: currentCard.fsrsLapses,
                          },
                          option.rating,
                          sessionNow,
                        );

                        return (
                          <Pressable
                            key={option.label}
                            onPress={() => void handleRate(option.rating)}
                            style={({ pressed }) => [
                              styles.rating,
                              { backgroundColor: option.color },
                              pressed && styles.controlPressed,
                            ]}
                          >
                            <View style={styles.ratingContent}>
                              <Text style={styles.ratingLabel}>
                                {option.label}
                              </Text>
                              <Text style={styles.ratingInterval}>
                                {formatCompactReviewInterval(
                                  preview.nextState.intervalMinutes ??
                                    preview.nextState.intervalDays * 1440,
                                )}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              </AnimatedReviewCard>
            </>
          ) : totalCards > 0 ? (
            <View testID="review-completion-card" style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryIconLabel}>✓</Text>
              </View>
              <Text style={styles.summaryTitle}>{t("completed")}</Text>
              <Text style={styles.summaryText}>
                {t("reviewedCards", {
                  count: totalCards,
                  label:
                    language === "en"
                      ? totalCards === 1
                        ? "card"
                        : "cards"
                      : totalCards === 1
                        ? "cartão"
                        : "cartões",
                  suffix: language === "en" ? "" : totalCards === 1 ? "" : "s",
                })}
              </Text>
              <Pressable onPress={onBack} style={styles.summaryButton}>
                <Text style={styles.summaryButtonLabel}>
                  {t("backToDecksPlain")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.empty}>{t("allReviewed")}</Text>
          )}
        </View>
      </View>
    </AnimatedScreen>
  );
}

interface AnimatedReviewCardProps extends PropsWithChildren {}

function AnimatedReviewCard({ children }: AnimatedReviewCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateX.setValue(20);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        duration: 220,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        duration: 260,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [opacity, translateX]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}
