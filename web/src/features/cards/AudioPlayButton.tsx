import { useEffect, useRef, useState } from "react";
import { useServices } from "../../app/ServicesProvider";
import { notify } from "../../components/notifications";
import { useLanguage } from "../../i18n/LanguageProvider";

interface AudioPlayButtonProps {
  cardId: string;
}

/** Toca o áudio da pergunta guardado no IndexedDB. */
export function AudioPlayButton({ cardId }: AudioPlayButtonProps) {
  const services = useServices();
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function toggle() {
    try {
      if (playing && audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
        return;
      }

      if (!audioRef.current) {
        const stored = await services.cards.findAudio(cardId);
        if (!stored) throw new Error(t("audioPlayError"));
        urlRef.current = URL.createObjectURL(
          new Blob([stored.data], { type: stored.type }),
        );
        const audio = new Audio(urlRef.current);
        audio.addEventListener("ended", () => setPlaying(false));
        audioRef.current = audio;
      }

      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      notify.error(t("audioPlayError"));
    }
  }

  return (
    <button
      aria-pressed={playing}
      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary-muted px-3 py-2 text-sm font-bold text-primary"
      onClick={() => void toggle()}
      type="button"
    >
      <span aria-hidden="true">{playing ? "⏸" : "▶"}</span>
      {playing ? t("pauseAudio") : t("playAudio")}
    </button>
  );
}
