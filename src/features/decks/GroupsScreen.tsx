import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import type { AppRoute } from "../../routes/types";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import type { DeckGroup } from "./domain/deckGroup";
import { createDeckGroupRepository } from "./groupRepository";
import { createDeckRepository } from "./repository";

interface GroupsScreenProps {
  onNavigate: (route: AppRoute) => void;
  onBack: () => void;
}

export function GroupsScreen({ onNavigate, onBack }: GroupsScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<DeckGroup[]>([]);
  const [hasUngroupedDecks, setHasUngroupedDecks] = useState(false);

  useEffect(() => {
    void Promise.all([
      createDeckGroupRepository(database).findAll(),
      createDeckRepository(database).findAll(),
    ]).then(([loadedGroups, decks]) => {
      setGroups(loadedGroups);
      setHasUngroupedDecks(decks.some((deck) => !deck.groupId));
    });
  }, [database]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    back: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginBottom: theme.spacing.lg,
    },
    title: { color: theme.colors.text, fontSize: 34, fontWeight: "800" },
    subtitle: {
      color: theme.colors.textSecondary,
      lineHeight: 23,
      marginTop: theme.spacing.sm,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    buttonLabel: {
      color: theme.colors.onPrimary,
      fontWeight: "800",
      textAlign: "center",
    },
    group: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      marginTop: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    groupName: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "800",
    },
    groupAction: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginTop: theme.spacing.sm,
    },
    empty: { color: theme.colors.textSecondary, marginTop: theme.spacing.xl },
  });

  async function deleteGroup(group: DeckGroup) {
    await createDeckGroupRepository(database).remove(group.id);
    setGroups((current) => current.filter((item) => item.id !== group.id));
    notify.success(t("deleteGroup"));
  }

  function renderGroup({ item: group }: { item: DeckGroup }) {
    return (
      <View style={styles.group}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Pressable
          onPress={() => onNavigate({ name: "decks", groupId: group.id })}
        >
          <Text style={styles.groupAction}>{t("openDecks")}</Text>
        </Pressable>
        <Pressable onPress={() => onNavigate({ name: "groupForm", group })}>
          <Text style={styles.groupAction}>{t("editGroup")}</Text>
        </Pressable>
        <Pressable onPress={() => void deleteGroup(group)}>
          <Text style={[styles.groupAction, { color: theme.colors.danger }]}>
            {t("deleteGroup")}
          </Text>
        </Pressable>
      </View>
    );
  }

  function renderFooter() {
    if (hasUngroupedDecks) {
      return (
        <View style={styles.group}>
          <Text style={styles.groupName}>{t("ungrouped")}</Text>
          <Pressable
            onPress={() => onNavigate({ name: "decks", groupId: null })}
          >
            <Text style={styles.groupAction}>{t("openDecks")}</Text>
          </Pressable>
        </View>
      );
    }
    return groups.length === 0 ? (
      <Text style={styles.empty}>{t("noGroups")}</Text>
    ) : null;
  }

  return (
    <AnimatedScreen>
      <FlatList<DeckGroup>
        contentContainerStyle={styles.container}
        data={groups}
        keyExtractor={(group) => group.id}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            <Pressable onPress={onBack}>
              <Text style={styles.back}>{t("backHome")}</Text>
            </Pressable>
            <Text style={styles.title}>{t("groups")}</Text>
            <Text style={styles.subtitle}>{t("groupsSubtitle")}</Text>
            <Pressable
              onPress={() => onNavigate({ name: "groupForm" })}
              style={styles.button}
            >
              <Text style={styles.buttonLabel}>{t("newGroup")}</Text>
            </Pressable>
          </>
        }
        renderItem={renderGroup}
      />
    </AnimatedScreen>
  );
}
