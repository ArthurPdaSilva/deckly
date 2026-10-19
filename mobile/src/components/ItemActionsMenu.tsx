import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLanguage } from "../styles/LanguageProvider";
import { useTheme } from "../styles/ThemeProvider";

export interface ItemAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface ItemActionsMenuProps {
  actions: ItemAction[];
  title?: string;
  testID?: string;
}

// No iOS, abrir outro Modal (ex.: confirmação de exclusão) enquanto este ainda
// está sendo fechado falha silenciosamente; por isso a ação espera o fechamento.
const ACTION_DELAY_MS = Platform.OS === "ios" ? 350 : 0;

export function ItemActionsMenu({
  actions,
  title,
  testID,
}: ItemActionsMenuProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  function handleSelect(action: ItemAction) {
    setVisible(false);
    setTimeout(action.onPress, ACTION_DELAY_MS);
  }

  const styles = StyleSheet.create({
    gear: {
      alignItems: "center",
      borderRadius: 999,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    gearPressed: { backgroundColor: theme.colors.primaryMuted },
    gearLabel: { color: theme.colors.textSecondary, fontSize: 22 },
    backdrop: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      flex: 1,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.colors.surfaceElevated,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    sheetTitle: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.bodySmall,
      fontWeight: "700",
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
      textTransform: "uppercase",
    },
    option: {
      borderRadius: 14,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    optionPressed: { backgroundColor: theme.colors.primaryMuted },
    optionLabel: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: "600",
    },
    optionDestructive: { color: theme.colors.danger },
  });

  return (
    <>
      <Pressable
        accessibilityLabel={t("options")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.gear, pressed && styles.gearPressed]}
        testID={testID}
      >
        <Text style={styles.gearLabel}>⚙</Text>
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <Pressable
          accessibilityLabel={t("cancel")}
          onPress={() => setVisible(false)}
          style={styles.backdrop}
        >
          <View style={styles.sheet}>
            {title ? (
              <Text numberOfLines={1} style={styles.sheetTitle}>
                {title}
              </Text>
            ) : null}
            {actions.map((action) => (
              <Pressable
                accessibilityRole="button"
                key={action.label}
                onPress={() => handleSelect(action)}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    action.destructive && styles.optionDestructive,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
