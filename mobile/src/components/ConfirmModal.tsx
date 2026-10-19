import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../styles/ThemeProvider";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    backdrop: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    panel: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.accent,
      borderRadius: 18,
      borderWidth: 1,
      maxWidth: 420,
      padding: theme.spacing.lg,
      width: "100%",
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "700",
    },
    message: {
      color: theme.colors.textSecondary,
      lineHeight: 21,
      marginTop: theme.spacing.sm,
    },
    actions: {
      flexDirection: "row",
      gap: theme.spacing.lg,
      justifyContent: "flex-end",
      marginTop: theme.spacing.lg,
    },
    cancelLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    confirmLabel: {
      color: theme.colors.danger,
      fontWeight: "700",
    },
  });

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View accessibilityRole="alert" style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm}>
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
