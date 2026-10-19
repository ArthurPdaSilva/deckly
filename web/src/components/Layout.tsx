import { NavLink, Outlet } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  BackupIcon,
  ChartIcon,
  DecksIcon,
  HomeIcon,
  SettingsIcon,
} from "./icons";

const NAV_ITEMS = [
  { to: "/", key: "home", end: true, icon: HomeIcon },
  { to: "/groups", key: "myDecks", end: false, icon: DecksIcon },
  { to: "/statistics", key: "progress", end: false, icon: ChartIcon },
  { to: "/backup", key: "backup", end: false, icon: BackupIcon },
  { to: "/settings", key: "settings", end: false, icon: SettingsIcon },
] as const;

/**
 * Um único cabeçalho/navegação: barra no topo em telas pequenas e menu lateral
 * fixo a partir de `lg`, sem duplicar os links no DOM.
 */
export function Layout() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-fg lg:flex">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        href="#conteudo"
      >
        {t("skipToContent")}
      </a>
      <header className="border-b border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch lg:gap-8 lg:p-0">
          <NavLink
            className="flex items-center gap-2 text-lg font-extrabold tracking-widest lg:px-3"
            to="/"
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-full bg-accent"
            />
            DECKLY
          </NavLink>
          <nav aria-label="Principal" className="-mx-1 overflow-x-auto lg:mx-0">
            <ul className="flex gap-1 lg:flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold lg:py-3 lg:text-base ${
                        isActive
                          ? "bg-primary-muted text-primary"
                          : "text-fg-secondary hover:bg-primary-muted"
                      }`
                    }
                    end={item.end}
                    to={item.to}
                  >
                    <item.icon />
                    {t(item.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-auto hidden px-3 text-xs leading-relaxed text-fg-muted lg:block">
          {t("localOnly")}
        </p>
      </header>
      <main
        className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"
        id="conteudo"
      >
        <Outlet />
      </main>
    </div>
  );
}
