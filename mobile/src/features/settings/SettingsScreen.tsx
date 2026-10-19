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
import {
  deleteAudioFile,
  persistAudioFile,
  pickAudioFiles,
  readAudioAsBase64,
  saveAudioFromBase64,
} from "../cards/audioStorage";
import { parseExportData, serializeExportData } from "../dataTransfer/format";
import { createDataTransferRepository } from "../dataTransfer/repository";
import {
  clampRetention,
  createAlgorithmRepository,
  DEFAULT_RETENTION,
} from "../review/algorithmRepository";
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
  const [retention, setRetention] = useState(DEFAULT_RETENTION);
  const [pendingReset, setPendingReset] = useState(false);
  const [seedPending, setSeedPending] = useState(false);
  const [deleteAllPending, setDeleteAllPending] = useState(false);
  const [pendingAudioCards, setPendingAudioCards] = useState<
    { id: string; frontAudioFile?: string | null }[] | null
  >(null);

  useEffect(() => {
    void createAlgorithmRepository(database)
      .getActiveAlgorithm()
      .then(setAlgorithm);
    void createAlgorithmRepository(database)
      .getDesiredRetention()
      .then(setRetention);
  }, [database]);

  async function changeRetention(delta: number) {
    const next = clampRetention(Math.round((retention + delta) * 100) / 100);
    setRetention(next);
    await createAlgorithmRepository(database).setDesiredRetention(next);
    notify.success(t("retentionUpdated"));
  }

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

  async function handleDeleteAll() {
    try {
      const audioUris =
        await createDataTransferRepository(database).deleteAllData();
      await Promise.all(audioUris.map((uri) => deleteAudioFile(uri)));
      notify.success(t("allDataDeleted"));
    } catch (cause) {
      notify.error(
        cause instanceof Error ? cause.message : t("deleteAllError"),
      );
    } finally {
      setDeleteAllPending(false);
    }
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
      const data =
        await createDataTransferRepository(database).exportData(
          readAudioAsBase64,
        );
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

  async function linkImportedAudio() {
    const expected = pendingAudioCards;
    setPendingAudioCards(null);
    if (!expected) return;

    try {
      const files = await pickAudioFiles();
      const byName = new Map(
        files.map((file) => [file.name.toLowerCase(), file] as const),
      );
      const repository = createDataTransferRepository(database);
      let linked = 0;
      for (const card of expected) {
        const file = byName.get((card.frontAudioFile ?? "").toLowerCase());
        if (!file) continue;
        const uri = await persistAudioFile(
          file,
          () => `${Date.now()}-${linked}`,
        );
        await repository.attachCardAudio(card.id, uri);
        linked += 1;
      }
      if (linked > 0) notify.success(t("audiosLinked", { count: linked }));
      if (linked < expected.length) {
        notify.error(t("audiosMissing", { count: expected.length - linked }));
      }
    } catch (cause) {
      notify.error(cause instanceof Error ? cause.message : t("importError"));
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
      // fetch lê o cache do seletor mesmo onde o file-system não tem permissão (ex.: Expo Go)
      const response = await fetch(result.assets[0].uri);
      const content = await response.text();
      const data = parseExportData(content);
      const repository = createDataTransferRepository(database);
      await repository.importData(data);
      notify.success(t("dataImported"));
      let embedded = 0;
      for (const card of data.cards) {
        if (!card.frontAudioData) continue;
        const uri = await saveAudioFromBase64(
          card.frontAudioFile ?? "audio.mp3",
          card.frontAudioData,
          () => `${Date.now()}-${embedded}`,
        );
        await repository.attachCardAudio(card.id, uri);
        embedded += 1;
      }
      const withAudio = data.cards.filter(
        (card) => card.frontAudioFile && !card.frontAudioData,
      );
      setPendingAudioCards(withAudio.length > 0 ? withAudio : null);
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
      alignItems: "center",
      borderColor: theme.colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
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
      alignItems: "center",
      borderColor: theme.colors.border,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
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
                })}
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
          {algorithm === "fsrs" ? (
            <View style={styles.algorithmConfirm}>
              <Text style={styles.panelTitle}>{t("retention")}</Text>
              <Text style={styles.algorithmDescription}>
                {t("retentionDescription")}
              </Text>
              <View style={styles.algorithmRow}>
                <Pressable
                  accessibilityLabel={t("decreaseRetention")}
                  onPress={() => void changeRetention(-0.01)}
                  style={styles.algorithmButton}
                >
                  <Text style={styles.algorithmButtonLabel}>−</Text>
                </Pressable>
                <View style={styles.algorithmButton}>
                  <Text
                    style={styles.algorithmButtonLabel}
                    testID="retention-value"
                  >{`${Math.round(retention * 100)}%`}</Text>
                </View>
                <Pressable
                  accessibilityLabel={t("increaseRetention")}
                  onPress={() => void changeRetention(0.01)}
                  style={styles.algorithmButton}
                >
                  <Text style={styles.algorithmButtonLabel}>+</Text>
                </Pressable>
              </View>
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
          {pendingAudioCards ? (
            <View style={styles.algorithmConfirm}>
              <Text style={styles.algorithmDescription}>
                {t("audiosPick", { count: pendingAudioCards.length })}
              </Text>
              <Pressable
                onPress={() => void linkImportedAudio()}
                style={styles.themeButton}
              >
                <Text style={styles.themeLabel}>{t("selectAudios")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setPendingAudioCards(null)}
                style={styles.button}
              >
                <Text style={styles.buttonLabel}>{t("skipAudios")}</Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable
            onPress={() => setDeleteAllPending(true)}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>{t("deleteAll")}</Text>
          </Pressable>
          {deleteAllPending ? (
            <View style={styles.algorithmConfirm}>
              <Text style={styles.algorithmDescription}>
                {t("deleteAllDescription")}
              </Text>
              <Pressable
                onPress={() => void handleDeleteAll()}
                style={styles.themeButton}
              >
                <Text style={styles.themeLabel}>{t("confirmDeleteAll")}</Text>
              </Pressable>
              <Pressable
                onPress={() => setDeleteAllPending(false)}
                style={styles.button}
              >
                <Text style={styles.buttonLabel}>{t("cancel")}</Text>
              </Pressable>
            </View>
          ) : null}
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
