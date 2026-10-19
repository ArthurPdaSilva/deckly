import { useEffect, useId, useRef } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { Button, buttonClass } from "./ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-3xl bg-elevated p-6 shadow-xl"
        role="dialog"
      >
        <h2 className="text-xl font-extrabold" id={titleId}>
          {title}
        </h2>
        <p className="mt-2 text-fg-secondary" id={messageId}>
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            className="sm:flex-1"
            onClick={onConfirm}
            variant={destructive ? "danger" : "primary"}
          >
            {confirmLabel}
          </Button>
          <button
            className={buttonClass("secondary", "sm:flex-1")}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
