import { StyleSheet, Text, View } from "react-native";
import Toast, {
  type ToastConfig,
  type ToastConfigParams,
} from "react-native-toast-message";
import { useTheme } from "../styles/ThemeProvider";

export type NotificationType = "success" | "error" | "info";

function NotificationToast({
  type,
  text1,
  text2,
}: ToastConfigParams<unknown> & { type: NotificationType }) {
  const { theme } = useTheme();
  const color =
    type === "success"
      ? theme.colors.success
      : type === "error"
        ? theme.colors.danger
        : theme.colors.primary;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderLeftColor: color,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (params) => <NotificationToast {...params} type="success" />,
  error: (params) => <NotificationToast {...params} type="error" />,
  info: (params) => <NotificationToast {...params} type="info" />,
};

function show(type: NotificationType, message: string) {
  Toast.show({
    type,
    text1: type === "success" ? "Sucesso" : type === "error" ? "Erro" : "Aviso",
    text2: message,
  });
}

export const notify = {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  info: (message: string) => show("info", message),
};

export function ToastHost() {
  return <Toast config={toastConfig} />;
}

const styles = StyleSheet.create({
  toast: {
    alignItems: "center",
    borderLeftWidth: 4,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 8,
    flexDirection: "row",
    gap: 12,
    minHeight: 68,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    width: "92%",
  },
  dot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
