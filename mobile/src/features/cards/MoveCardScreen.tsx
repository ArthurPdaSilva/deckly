import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import { translateError } from "../../styles/translations";
import type { Deck } from "../decks/domain/deck";
import { createDeckRepository } from "../decks/repository";
import type { Flashcard } from "./domain/flashcard";
import { createFlashcardRepository } from "./repository";
import { moveFlashcard } from "./useCases";

interface MoveCardScreenProps {
  card: Flashcard;
  deck: Deck;
  onBack: () => void;
  onMoved: () => void;
}

export function MoveCardScreen({
  card,
  deck,
  onBack,
  onMoved,
}: MoveCardScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void createDeckRepository(database)
      .findAll()
      .then((loadedDecks) => {
        if (mounted) {
          setDecks(loadedDecks.filter((item) => item.id !== deck.id));
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [database, deck.id]);

  async function handleMove(targetDeck: Deck) {
    if (isMoving) {
      return;
    }

    setIsMoving(true);
    try {
      await moveFlashcard(
        createFlashcardRepository(database),
        card,
        targetDeck.id,
        new Date(),
      );
      notify.success(t("cardMoved", { deck: targetDeck.name }));
      onMoved();
    } catch (cause) {
      notify.error(
        cause instanceof Error
          ? translateError(language, cause.message)
          : String(cause),
      );
      setIsMoving(false);
    }
  }

  const styles = StyleSheet.create({
    list: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    container: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
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
    subtitle: {
      color: theme.colors.textSecondary,
      lineHeight: 21,
      marginTop: theme.spacing.sm,
    },
    preview: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    previewLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    previewText: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      marginTop: theme.spacing.xs,
    },
    previewDeck: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.bodySmall,
      marginTop: theme.spacing.sm,
    },
    option: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    optionPressed: {
      borderColor: theme.colors.primary,
      opacity: 0.85,
    },
    optionName: {
      color: theme.colors.text,
      fontWeight: "700",
    },
    optionDescription: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.bodySmall,
      marginTop: theme.spacing.xs,
    },
    empty: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.lg,
    },
  });

  return (
    <AnimatedScreen>
      <FlatList<Deck>
        contentContainerStyle={styles.container}
        data={decks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>{t("noOtherDecks")}</Text>
          )
        }
        ListHeaderComponent={
          <>
            <Pressable onPress={onBack}>
              <Text style={styles.back}>{t("back")}</Text>
            </Pressable>
            <Text style={styles.eyebrow}>{t("moveCardEyebrow")}</Text>
            <Text style={styles.title}>{t("moveCardTitle")}</Text>
            <Text style={styles.subtitle}>{t("moveCardText")}</Text>
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>{t("front")}</Text>
              <Text numberOfLines={3} style={styles.previewText}>
                {card.front}
              </Text>
              <Text style={styles.previewDeck}>
                {t("currentDeck", { deck: deck.name })}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            disabled={isMoving}
            onPress={() => void handleMove(item)}
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
            ]}
          >
            <Text style={styles.optionName}>{item.name}</Text>
            {item.description ? (
              <Text numberOfLines={2} style={styles.optionDescription}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        )}
        style={styles.list}
      />
    </AnimatedScreen>
  );
}
