import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";

export interface ItemAction {
  label: string;
  destructive?: boolean;
  onSelect: () => void;
}

interface ItemActionsMenuProps {
  title: string;
  actions: ItemAction[];
}

export function ItemActionsMenu({ title, actions }: ItemActionsMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${t("options")}: ${title}`}
        className="flex size-10 items-center justify-center rounded-full text-xl font-extrabold text-fg-secondary hover:bg-primary-muted"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        ⋮
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-1 min-w-44 rounded-2xl border border-line bg-elevated p-1 shadow-lg"
          id={menuId}
          role="menu"
        >
          {actions.map((action) => (
            <button
              className={`block w-full rounded-xl px-3 py-2 text-left font-semibold hover:bg-primary-muted ${
                action.destructive ? "text-danger" : "text-fg"
              }`}
              key={action.label}
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              role="menuitem"
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
