import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import { translateError } from "../../styles/translations";
import type { DeckGroup } from "./domain/deckGroup";
import { createDeckGroupRepository } from "./groupRepository";
import { createDeckGroup, renameDeckGroup } from "./groupUseCases";

interface GroupFormScreenProps {
  group?: DeckGroup;
  onBack: () => void;
}

export function GroupFormScreen({ group, onBack }: GroupFormScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [name, setName] = useState(group?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      const repository = createDeckGroupRepository(database);
      if (group) {
        await renameDeckGroup(repository, group, name, new Date());
      } else {
        const groups = await repository.findAll();
        await createDeckGroup(repository, name, {
          now: new Date(),
          createId: () => `group-${Date.now()}`,
          sortOrder: groups.length,
        });
      }
      notify.success(group ? t("saveGroup") : t("createGroup"));
      onBack();
    } catch (cause) {
      const message = translateError(
        language,
        cause instanceof Error ? cause.message : t("createGroup"),
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
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
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
            {group ? t("formEditGroup") : t("formNewGroup")}
          </Text>
          <Text style={styles.hint}>{t("groupHint")}</Text>
          <TextInput
            accessibilityLabel={t("groupName")}
            onChangeText={setName}
            placeholder={t("groupName")}
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            value={name}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void handleSave()} style={styles.button}>
            <Text style={styles.buttonLabel}>
              {group ? t("saveGroup") : t("createGroup")}
            </Text>
          </Pressable>
        </View>
      </View>
    </AnimatedScreen>
  );
}
