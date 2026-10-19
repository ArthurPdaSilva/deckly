import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../app/App";
import { ServicesProvider } from "../app/ServicesProvider";
import { createServices, type Services } from "../app/services";
import { DecklyDatabase } from "../db/database";
import type { Flashcard } from "../features/cards/domain";
import { LanguageProvider } from "../i18n/LanguageProvider";
import type { Language } from "../i18n/translations";
import { ThemeProvider } from "../theme/ThemeProvider";

export const FIXED_NOW = new Date("2026-10-19T12:00:00.000Z");

let databaseCounter = 0;

/** Banco isolado por teste (fake-indexeddb) com relógio e IDs previsíveis. */
export function createTestServices(now: Date = FIXED_NOW): Services {
  databaseCounter += 1;
  let idCounter = 0;
  return createServices({
    db: new DecklyDatabase(`deckly-test-${databaseCounter}-${Math.random()}`),
    now: () => new Date(now),
    createId: () => {
      idCounter += 1;
      return `id-${idCounter}`;
    },
  });
}

export function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "card-1",
    deckId: "deck-1",
    front: "Pergunta",
    back: "Resposta",
    frontAudioUri: null,
    dueAt: "2026-10-19T11:00:00.000Z",
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

/** Cria um grupo, um baralho e cartões vencidos para os testes de tela. */
export async function seedBasicData(
  services: Services,
  options: { cards?: number } = {},
) {
  await services.groups.save({
    id: "group-1",
    name: "Concursos",
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    sortOrder: 0,
  });
  await services.decks.save({
    id: "deck-1",
    name: "Português",
    description: "Ortografia",
    groupId: "group-1",
    sortOrder: 0,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  });
  for (let index = 0; index < (options.cards ?? 2); index += 1) {
    await services.cards.save(
      makeCard({
        id: `card-${index + 1}`,
        front: `Pergunta ${index + 1}`,
        back: `Resposta ${index + 1}`,
        createdAt: `2026-10-01T10:0${index}:00.000Z`,
      }),
    );
  }
}

interface RenderAppOptions {
  route?: string;
  services?: Services;
  language?: Language;
}

export function renderApp({
  route = "/",
  services = createTestServices(),
  language = "pt-BR",
}: RenderAppOptions = {}) {
  const user = userEvent.setup();
  const result = render(
    <ServicesProvider services={services}>
      <ThemeProvider initialMode="light">
        <LanguageProvider initialLanguage={language}>
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        </LanguageProvider>
      </ThemeProvider>
    </ServicesProvider>,
  );
  return { user, services, ...result };
}
