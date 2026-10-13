import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, StyleSheet, Text } from "react-native";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../styles/LanguageProvider";
import { useTheme } from "../../styles/ThemeProvider";

interface AudioPlayButtonProps {
  uri: string;
}

export function AudioPlayButton({ uri }: AudioPlayButtonProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;

  function handlePress() {
    try {
      if (isPlaying) {
        player.pause();
        return;
      }

      if (status.didJustFinish || status.currentTime >= status.duration) {
        void player.seekTo(0);
      }
      player.play();
    } catch {
      notify.error(t("audioPlayError"));
    }
  }

  const styles = StyleSheet.create({
    button: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
    label: { color: theme.colors.onPrimary, fontWeight: "800" },
  });

  return (
    <Pressable
      accessibilityLabel={isPlaying ? t("pauseAudio") : t("playAudio")}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>
        {isPlaying ? `⏸ ${t("pauseAudio")}` : `▶ ${t("playAudio")}`}
      </Text>
    </Pressable>
  );
}
