import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { useTheme } from "../../styles/ThemeProvider";
import type { Flashcard } from "../cards/domain/flashcard";
import type { ReviewRating } from "./domain/scheduler";
import { createReviewRepository } from "./repository";
import { Sm2Scheduler } from "./sm2Scheduler";

interface ReviewScreenProps {
  now?: Date;
  onBack: () => void;
}

export function ReviewScreen({ now = new Date(), onBack }: ReviewScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const [sessionNow] = useState(() => now ?? new Date());
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void createReviewRepository(database)
      .findDueCards(sessionNow.toISOString())
      .then((dueCards) => {
        if (mounted) {
          setCards(dueCards);
          setTotalCards(dueCards.length);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [database, sessionNow]);

  async function handleRate(rating: ReviewRating) {
    const card = cards[0];
    if (!card || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = new Sm2Scheduler().schedule(
        {
          dueAt: card.dueAt,
          intervalDays: card.intervalDays,
          easeFactor: card.easeFactor,
          repetitions: card.repetitions,
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
      notify.success("Revisão registrada.");
    } catch (cause) {
      notify.error(
        cause instanceof Error
          ? cause.message
          : "Não foi possível registrar a revisão",
      );
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
      justifyContent: "center",
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
    progress: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
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
    ratings: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    rating: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      flex: 1,
      padding: theme.spacing.md,
    },
    ratingLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
    empty: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      marginTop: theme.spacing.xl,
    },
    summaryTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "700",
      marginTop: theme.spacing.xl,
    },
    summaryText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      marginTop: theme.spacing.sm,
    },
  });

  const currentCard = cards[0];

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>
        <View testID="review-content" style={styles.sessionContent}>
          <Text style={styles.eyebrow}>SESSÃO DE HOJE</Text>
          <Text style={styles.title}>Revisar</Text>
          {isLoading ? (
            <Text style={styles.empty}>Preparando sua sessão...</Text>
          ) : currentCard ? (
            <>
              <Text style={styles.progress}>
                Cartão {totalCards - cards.length + 1} de {totalCards}
              </Text>
              <View style={styles.card}>
                <Text style={styles.label}>Frente</Text>
                <Text style={styles.content}>{currentCard.front}</Text>
                {showAnswer ? (
                  <View style={styles.divider}>
                    <Text style={styles.label}>Verso</Text>
                    <Text style={styles.content}>{currentCard.back}</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowAnswer(true)}
                    style={styles.reveal}
                  >
                    <Text style={styles.revealLabel}>Mostrar resposta</Text>
                  </Pressable>
                )}
                {showAnswer ? (
                  <View style={styles.ratings}>
                    <Pressable
                      onPress={() => void handleRate(2)}
                      style={styles.rating}
                    >
                      <Text style={styles.ratingLabel}>Difícil</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleRate(4)}
                      style={styles.rating}
                    >
                      <Text style={styles.ratingLabel}>Bom</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleRate(5)}
                      style={styles.rating}
                    >
                      <Text style={styles.ratingLabel}>Fácil</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </>
          ) : totalCards > 0 ? (
            <>
              <Text style={styles.summaryTitle}>Sessão concluída</Text>
              <Text style={styles.summaryText}>
                {`${totalCards} ${totalCards === 1 ? "cartão" : "cartões"} revisado${totalCards === 1 ? "" : "s"}.`}
              </Text>
            </>
          ) : (
            <Text style={styles.empty}>Tudo revisado por hoje.</Text>
          )}
        </View>
      </View>
    </AnimatedScreen>
  );
}
