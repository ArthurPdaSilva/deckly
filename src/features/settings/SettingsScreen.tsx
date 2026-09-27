import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";
import { notify } from "../../components/notifications";
import { isDevelopmentModeEnabled } from "../../config/development";
import { resetAndSeedDatabase } from "../../database/seed";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";
import { parseExportData, serializeExportData } from "../dataTransfer/format";
import { createDataTransferRepository } from "../dataTransfer/repository";
import { createAlgorithmRepository } from "../review/algorithmRepository";
import type { SchedulerAlgorithm } from "../review/domain/scheduler";

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const database = useSQLiteContext();
  const { mode, theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [algorithm, setAlgorithm] = useState<SchedulerAlgorithm>("sm-2");
  const [pendingAlgorithm, setPendingAlgorithm] =
    useState<SchedulerAlgorithm | null>(null);
  const [pendingReset, setPendingReset] = useState(false);
  const [seedPending, setSeedPending] = useState(false);

  useEffect(() => {
    void createAlgorithmRepository(database)
      .getActiveAlgorithm()
      .then(setAlgorithm);
  }, [database]);

  async function confirmAlgorithmChange() {
    if (!pendingAlgorithm) return;
    await createAlgorithmRepository(database).setActiveAlgorithm(
      pendingAlgorithm,
    );
    setAlgorithm(pendingAlgorithm);
    setPendingAlgorithm(null);
    notify.success(t("algorithmUpdated"));
  }

  async function confirmReset() {
    await createAlgorithmRepository(database).resetSchedule(
      algorithm,
      new Date().toISOString(),
    );
    setPendingReset(false);
    notify.success(t("scheduleReset"));
  }

  async function handleSeedDatabase() {
    try {
      await resetAndSeedDatabase(database);
      notify.success(t("dataImported"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("seedLoadError"));
    } finally {
      setSeedPending(false);
    }
  }

  async function exportData() {
    try {
      const data = await createDataTransferRepository(database).exportData();
      const directory = FileSystem.documentDirectory;
      if (!directory) {
        throw new Error("Armazenamento local indisponível");
      }
      const uri = `${directory}deckly-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(
        uri,
        serializeExportData(data, new Date().toISOString()),
        { encoding: FileSystem.EncodingType.UTF8 },
      );
      await Sharing.shareAsync(uri, {
        dialogTitle: t("exportDialogTitle"),
        mimeType: "application/json",
      });
      notify.success(t("dataExported"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("exportError"));
    }
  }

  async function importData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: "application/json",
      });
      if (result.canceled) {
        return;
      }
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      await createDataTransferRepository(database).importData(
        parseExportData(content),
      );
      notify.success(t("dataImported"));
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("importError"));
    }
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
    },
    back: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginBottom: theme.spacing.xl,
    },
    title: { color: theme.colors.text, fontSize: 32, fontWeight: "800" },
    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    panel: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 22,
      borderWidth: 1,
      marginTop: theme.spacing.xl,
      padding: theme.spacing.lg,
    },
    panelTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.heading,
      fontWeight: "700",
    },
    button: {
      borderColor: theme.colors.border,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
    buttonLabel: {
      color: theme.colors.primary,
      fontWeight: "700",
      textAlign: "center",
    },
    themeButton: {
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: 14,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
    themeLabel: {
      color: theme.colors.primary,
      fontWeight: "800",
      textAlign: "center",
    },
    languageRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    languageButton: {
      borderColor: theme.colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      padding: theme.spacing.sm,
    },
    languageButtonActive: {
      backgroundColor: theme.colors.primaryMuted,
      borderColor: theme.colors.primary,
    },
    languageLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      textAlign: "center",
    },
    algorithmDescription: {
      color: theme.colors.textSecondary,
      lineHeight: 21,
      marginTop: theme.spacing.sm,
    },
    algorithmRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    algorithmButton: {
      borderColor: theme.colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      padding: theme.spacing.sm,
    },
    algorithmButtonActive: {
      backgroundColor: theme.colors.primaryMuted,
      borderColor: theme.colors.primary,
    },
    algorithmButtonLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      textAlign: "center",
    },
    algorithmConfirm: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.accent,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
  });

  return (
    <AnimatedScreen>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={styles.container}
      >
        <Pressable onPress={onBack}>
          <Text style={styles.back}>{t("backHome")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("settings")}</Text>
        <Text style={styles.subtitle}>{t("preferences")}</Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t("appearance")}</Text>
          <Pressable onPress={toggleTheme} style={styles.themeButton}>
            <Text style={styles.themeLabel}>
              {mode === "dark" ? t("useLight") : t("useDark")}
            </Text>
          </Pressable>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t("language")}</Text>
          <View style={styles.languageRow}>
            {(["pt-BR", "en"] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setLanguage(option)}
                style={[
                  styles.languageButton,
                  language === option && styles.languageButtonActive,
                ]}
              >
                <Text style={styles.languageLabel}>
                  {option === "pt-BR" ? "Português (Brasil)" : "English"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t("algorithm")}</Text>
          <Text style={styles.algorithmDescription}>
            {t("algorithmDescription")}
          </Text>
          <View style={styles.algorithmRow}>
            {(["sm-2", "fsrs"] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setPendingAlgorithm(option)}
                style={[
                  styles.algorithmButton,
                  algorithm === option && styles.algorithmButtonActive,
                ]}
              >
                <Text style={styles.algorithmButtonLabel}>
                  {option === "sm-2" ? "SM-2" : "FSRS"}
                </Text>
              </Pressable>
            ))}
          </View>
          {pendingAlgorithm && pendingAlgorithm !== algorithm ? (
            <View style={styles.algorithmConfirm}>
              <Text style={styles.algorithmDescription}>
                {t("algorithmConfirm", {
                  algorithm: pendingAlgorithm.toUpperCase(),
                })}{" "}
                {pendingAlgorithm.toUpperCase()} às próximas revisões?
              </Text>
              <Pressable
                onPress={() => void confirmAlgorithmChange()}
                style={styles.themeButton}
              >
                <Text style={styles.themeLabel}>{t("confirmChange")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setPendingAlgorithm(null)}
                style={styles.button}
              >
                <Text style={styles.buttonLabel}>{t("cancel")}</Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable
            onPress={() => setPendingReset(true)}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>{t("resetSchedule")}</Text>
          </Pressable>
          {pendingReset ? (
            <View style={styles.algorithmConfirm}>
              <Text style={styles.algorithmDescription}>
                {t("resetDescription")}
              </Text>
              <Pressable
                onPress={() => void confirmReset()}
                style={styles.themeButton}
              >
                <Text style={styles.themeLabel}>{t("confirmReset")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setPendingReset(false)}
                style={styles.button}
              >
                <Text style={styles.buttonLabel}>{t("cancel")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t("localData")}</Text>
          <Pressable onPress={() => void exportData()} style={styles.button}>
            <Text style={styles.buttonLabel}>{t("exportData")}</Text>
          </Pressable>
          <Pressable onPress={() => void importData()} style={styles.button}>
            <Text style={styles.buttonLabel}>{t("importData")}</Text>
          </Pressable>
        </View>
        {isDevelopmentModeEnabled() ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t("testData")}</Text>
            <Text style={styles.algorithmDescription}>
              {t("testDataDescription")}
            </Text>
            <Pressable
              onPress={() => setSeedPending(true)}
              style={styles.button}
            >
              <Text style={styles.buttonLabel}>{t("loadTestData")}</Text>
            </Pressable>
            {seedPending ? (
              <View style={styles.algorithmConfirm}>
                <Text style={styles.algorithmDescription}>
                  {t("seedDescription")}
                </Text>
                <Pressable
                  onPress={() => void handleSeedDatabase()}
                  style={styles.themeButton}
                >
                  <Text style={styles.themeLabel}>{t("confirm")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSeedPending(false)}
                  style={styles.button}
                >
                  <Text style={styles.buttonLabel}>{t("cancel")}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </AnimatedScreen>
  );
}
