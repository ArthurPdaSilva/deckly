import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import type { Deck } from "../decks/domain/deck";
import type { Flashcard } from "./domain/flashcard";
import { createFlashcardRepository } from "./repository";
import { deleteFlashcard, listFlashcards } from "./useCases";

interface CardsScreenProps {
  deck: Deck;
  onBack: () => void;
  onReview?: () => void;
  onCreateCard?: () => void;
  onEditCard?: (card: Flashcard) => void;
}

export function CardsScreen({
  deck,
  onBack,
  onReview,
  onCreateCard,
  onEditCard,
}: CardsScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardPendingDelete, setCardPendingDelete] = useState<Flashcard | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    const repository = createFlashcardRepository(database);

    void listFlashcards(repository, deck.id).then((loadedCards) => {
      if (mounted) {
        setCards(loadedCards);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [database, deck.id]);

  async function handleConfirmDelete() {
    if (!cardPendingDelete) {
      return;
    }

    await deleteFlashcard(
      createFlashcardRepository(database),
      cardPendingDelete.id,
    );
    setCards((currentCards) =>
      currentCards.filter((card) => card.id !== cardPendingDelete.id),
    );
    setCardPendingDelete(null);
    notify.success(t("delete"));
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
      marginBottom: theme.spacing.lg,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: theme.typography.bodySmall,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    title: {
      color: theme.colors.text,
      fontSize: 30,
      fontWeight: "700",
      marginTop: theme.spacing.xs,
    },
    reviewButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      minHeight: 84,
      padding: theme.spacing.md,
      textAlignVertical: "top",
    },
    editorPanel: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.primaryMuted,
      borderRadius: 22,
      borderWidth: 1,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    editorTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "700",
    },
    editorHint: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    editorInput: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primaryMuted,
      borderRadius: 14,
      borderWidth: 1,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      minHeight: 76,
      padding: theme.spacing.md,
      textAlignVertical: "top",
    },
    editorActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    editorSave: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    editorSaveLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
    editorCancel: {
      borderColor: theme.colors.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    editorCancelLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    button: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      minHeight: 52,
    },
    buttonPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
    buttonLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
    },
    cancelButton: {
      alignItems: "center",
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      minHeight: 48,
    },
    cancelButtonLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    error: {
      color: theme.colors.danger,
      marginTop: theme.spacing.sm,
    },
    empty: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.lg,
    },
    card: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: 20,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.lg,
    },
    cardLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    cardText: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      marginTop: theme.spacing.xs,
    },
    cardBack: {
      borderColor: theme.colors.border,
      borderTopWidth: 1,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    cardActions: {
      flexDirection: "row",
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    editAction: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    deleteAction: {
      color: theme.colors.danger,
      fontWeight: "700",
    },
    confirmation: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.accent,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    confirmationTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: "700",
    },
    confirmationText: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    confirmationActions: {
      flexDirection: "row",
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>{t("backToDecks")}</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{t("cards")}</Text>
        <Text style={styles.title}>{deck.name}</Text>
        {onReview ? (
          <Pressable onPress={onReview} style={styles.reviewButton}>
            <Text style={styles.buttonLabel}>{t("reviewDeck")}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onCreateCard}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonLabel}>{t("newCard")}</Text>
        </Pressable>
        {isLoading ? (
          <Text style={styles.empty}>{t("loadingCards")}</Text>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(card) => card.id}
            ListEmptyComponent={
              <Text style={styles.empty}>{t("noCardsCreated")}</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t("front")}</Text>
                <Text style={styles.cardText}>{item.front}</Text>
                <View style={styles.cardBack}>
                  <Text style={styles.cardLabel}>{t("backSide")}</Text>
                  <Text style={styles.cardText}>{item.back}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => onEditCard?.(item)}>
                    <Text style={styles.editAction}>{t("edit")}</Text>
                  </Pressable>
                  <Pressable onPress={() => setCardPendingDelete(item)}>
                    <Text style={styles.deleteAction}>{t("delete")}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
        {cardPendingDelete ? (
          <View style={styles.confirmation}>
            <Text style={styles.confirmationTitle}>{t("deleteCardTitle")}</Text>
            <Text style={styles.confirmationText}>{t("deleteCardText")}</Text>
            <View style={styles.confirmationActions}>
              <Pressable onPress={() => setCardPendingDelete(null)}>
                <Text style={styles.editAction}>{t("cancel")}</Text>
              </Pressable>
              <Pressable onPress={() => void handleConfirmDelete()}>
                <Text style={styles.deleteAction}>{t("confirmDelete")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </AnimatedScreen>
  );
}
