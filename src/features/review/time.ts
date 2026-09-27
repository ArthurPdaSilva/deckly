import type { Language } from "../../styles/LanguageProvider";

export function formatTimeUntil(
  isoDate: string,
  now: Date,
  language: Language = "pt-BR",
): string {
  const difference = new Date(isoDate).getTime() - now.getTime();
  if (difference <= 0) {
    return language === "en" ? "now" : "agora";
  }

  const minutes = Math.round(difference / 60000);
  if (minutes < 60) {
    return language === "en" ? `in ${minutes} min` : `em ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return language === "en" ? `in ${hours} hr` : `em ${hours} h`;
  }

  const days = Math.round(hours / 24);
  return language === "en" ? `in ${days} days` : `em ${days} dias`;
}

export function formatReviewInterval(intervalDays: number): string {
  return intervalDays === 1
    ? "Revisar amanhã"
    : `Revisar em ${intervalDays} dias`;
}

export function formatCompactReviewInterval(intervalMinutes: number): string {
  if (intervalMinutes < 60) return `${intervalMinutes}m`;
  if (intervalMinutes < 1440) return `${Math.round(intervalMinutes / 60)}h`;
  return `${Math.round(intervalMinutes / 1440)}d`;
}
