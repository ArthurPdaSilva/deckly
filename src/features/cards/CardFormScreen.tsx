import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import { translateError } from "../../styles/translations";
import type { Deck } from "../decks/domain/deck";
import type { Flashcard } from "./domain/flashcard";
import { createFlashcardRepository } from "./repository";
import { createFlashcard, updateFlashcard } from "./useCases";

interface CardFormScreenProps {
  deck: Deck;
  card?: Flashcard;
  onBack: () => void;
}

export function CardFormScreen({ deck, card, onBack }: CardFormScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      const repository = createFlashcardRepository(database);
      if (card) {
        await updateFlashcard(repository, card, { front, back }, new Date());
      } else {
        await createFlashcard(
          repository,
          deck.id,
          { front, back },
          { now: new Date(), createId: () => `card-${Date.now()}` },
        );
      }
      notify.success(card ? t("saveCard") : t("createCard"));
      onBack();
    } catch (cause) {
      const message = translateError(
        language,
        cause instanceof Error ? cause.message : t("createCard"),
      );
      setError(message);
      notify.error(message);
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
    panel: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      padding: theme.spacing.lg,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.typography.title,
      fontWeight: "800",
    },
    hint: {
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginTop: theme.spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 14,
      borderWidth: 1,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      minHeight: 130,
      padding: theme.spacing.md,
      textAlignVertical: "top",
    },
    error: { color: theme.colors.danger, marginTop: theme.spacing.sm },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
    buttonLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "800",
      textAlign: "center",
    },
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>
            {t("back")} {deck.name}
          </Text>
        </Pressable>
        <View style={styles.panel}>
          <Text style={styles.title}>
            {card ? t("formEditCard") : t("formNewCard")}
          </Text>
          <Text style={styles.hint}>{t("cardHint")}</Text>
          <TextInput
            accessibilityLabel={t("cardFront")}
            multiline
            onChangeText={setFront}
            placeholder={t("cardFront")}
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            value={front}
          />
          <TextInput
            accessibilityLabel={t("cardBack")}
            multiline
            onChangeText={setBack}
            placeholder={t("cardBack")}
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            value={back}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void handleSave()} style={styles.button}>
            <Text style={styles.buttonLabel}>
              {card ? t("saveCard") : t("createCard")}
            </Text>
          </Pressable>
        </View>
      </View>
    </AnimatedScreen>
  );
}
