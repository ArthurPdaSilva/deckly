import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ItemActionsMenu } from "../../components/ItemActionsMenu";
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
  reloadKey?: number;
}

export function GroupsScreen({
  onNavigate,
  onBack,
  reloadKey = 0,
}: GroupsScreenProps) {
  const database = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<DeckGroup[]>([]);
  const [hasUngroupedDecks, setHasUngroupedDecks] = useState(false);
  const [groupPendingDelete, setGroupPendingDelete] =
    useState<DeckGroup | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey forces a reload when the screen regains focus
  useEffect(() => {
    let mounted = true;
    void Promise.all([
      createDeckGroupRepository(database).findAll(),
      createDeckRepository(database).findAll(),
    ]).then(([loadedGroups, decks]) => {
      if (mounted) {
        setGroups(loadedGroups);
        setHasUngroupedDecks(decks.some((deck) => !deck.groupId));
      }
    });

    return () => {
      mounted = false;
    };
  }, [database, reloadKey]);

  const styles = StyleSheet.create({
    list: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    container: {
      flexGrow: 1,
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
    },
    groupContent: {
      borderRadius: 18,
      padding: theme.spacing.lg,
      paddingRight: 56,
    },
    groupPressed: { opacity: 0.86 },
    menu: {
      position: "absolute",
      right: theme.spacing.sm,
      top: theme.spacing.sm,
    },
    groupName: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "800",
    },
    empty: { color: theme.colors.textSecondary, marginTop: theme.spacing.xl },
  });

  async function deleteGroup(group: DeckGroup) {
    await createDeckGroupRepository(database).remove(group.id);
    setGroups((current) => current.filter((item) => item.id !== group.id));
    notify.success(t("deleteGroup"));
  }

  async function handleConfirmDelete() {
    if (!groupPendingDelete) {
      return;
    }

    await deleteGroup(groupPendingDelete);
    setGroupPendingDelete(null);
  }

  function renderGroup({ item: group }: { item: DeckGroup }) {
    return (
      <View style={styles.group}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate({ name: "decks", groupId: group.id })}
          style={({ pressed }) => [
            styles.groupContent,
            pressed && styles.groupPressed,
          ]}
        >
          <Text style={styles.groupName}>{group.name}</Text>
        </Pressable>
        <View style={styles.menu}>
          <ItemActionsMenu
            actions={[
              {
                label: t("edit"),
                onPress: () => onNavigate({ name: "groupForm", group }),
              },
              {
                label: t("delete"),
                destructive: true,
                onPress: () => setGroupPendingDelete(group),
              },
            ]}
            testID={`group-menu-${group.id}`}
            title={group.name}
          />
        </View>
      </View>
    );
  }

  function renderFooter() {
    if (hasUngroupedDecks) {
      return (
        <View style={styles.group}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onNavigate({ name: "decks", groupId: null })}
            style={({ pressed }) => [
              styles.groupContent,
              pressed && styles.groupPressed,
            ]}
          >
            <Text style={styles.groupName}>{t("ungrouped")}</Text>
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
        style={styles.list}
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
      <ConfirmModal
        cancelLabel={t("cancel")}
        confirmLabel={t("confirmDelete")}
        message={t("deleteGroupText")}
        onCancel={() => setGroupPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t("deleteGroupTitle")}
        visible={groupPendingDelete !== null}
      />
    </AnimatedScreen>
  );
}
