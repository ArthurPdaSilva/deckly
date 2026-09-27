import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import { translateError } from "../../styles/translations";
import type { Deck } from "./domain/deck";
import { createDeckRepository } from "./repository";
import { createDeck, updateDeck } from "./useCases";

interface DeckFormScreenProps {
  deck?: Deck;
  groupId?: string | null;
  onBack: () => void;
}

export function DeckFormScreen({ deck, groupId, onBack }: DeckFormScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [name, setName] = useState(deck?.name ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      const repository = createDeckRepository(database);
      if (deck) {
        await updateDeck(repository, deck, { name, description }, new Date());
      } else {
        const decks = await repository.findAll();
        await createDeck(
          repository,
          {
            name,
            description,
            groupId,
            sortOrder: decks.filter((item) => item.groupId === groupId).length,
          },
          {
            now: new Date(),
            createId: () => `deck-${Date.now()}`,
          },
        );
      }
      notify.success(deck ? t("saveDeck") : t("createDeck"));
      onBack();
    } catch (cause) {
      const message = translateError(
        language,
        cause instanceof Error ? cause.message : t("createDeck"),
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
      padding: theme.spacing.md,
    },
    description: { minHeight: 110, textAlignVertical: "top" },
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
    error: { color: theme.colors.danger, marginTop: theme.spacing.sm },
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>{t("back")}</Text>
        </Pressable>
        <View style={styles.panel}>
          <Text style={styles.title}>
            {deck ? t("formEditDeck") : t("formNewDeck")}
          </Text>
          <Text style={styles.hint}>{t("deckHint")}</Text>
          <TextInput
            accessibilityLabel={t("deckName")}
            onChangeText={setName}
            placeholder={t("deckName")}
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            value={name}
          />
          <TextInput
            accessibilityLabel={t("deckDescription")}
            multiline
            onChangeText={setDescription}
            placeholder={t("optionalDescription")}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, styles.description]}
            value={description}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void handleSave()} style={styles.button}>
            <Text style={styles.buttonLabel}>
              {deck ? t("saveDeck") : t("createDeck")}
            </Text>
          </Pressable>
        </View>
      </View>
    </AnimatedScreen>
  );
}
