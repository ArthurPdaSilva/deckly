import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readAsText } from "../../lib/files";
import {
  createTestServices,
  FIXED_NOW,
  renderApp,
  seedBasicData,
} from "../../test/helpers";
import { parseExportData } from "../dataTransfer/format";

const NOW = FIXED_NOW.toISOString();

function captureDownload() {
  const createObjectURL = vi.fn(() => "blob:deckly");
  const revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
  return { createObjectURL, revokeObjectURL, click };
}

function backupFile(overrides: Record<string, unknown> = {}, name = "b.json") {
  return new File(
    [
      JSON.stringify({
        format: "deckly",
        version: 1,
        exportedAt: NOW,
        groups: [],
        decks: [
          {
            id: "d9",
            name: "Do arquivo",
            description: "",
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
        cards: [
          {
            id: "c9",
            deckId: "d9",
            front: "Frente",
            back: "Verso",
            dueAt: NOW,
            intervalDays: 0,
            easeFactor: 2.5,
            repetitions: 0,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
        reviews: [],
        ...overrides,
      }),
    ],
    name,
    { type: "application/json" },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
});

describe("backup", () => {
  it("baixa o backup com data no nome, preferências e registra o último backup", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    await services.algorithm.setActiveAlgorithm("fsrs");
    await services.algorithm.setDesiredRetention(0.93);
    const { createObjectURL, revokeObjectURL, click } = captureDownload();
    const { user } = renderApp({ route: "/backup", services });

    expect(
      await screen.findByText("Você ainda não fez nenhum backup."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Baixar backup" }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    const [blob] = createObjectURL.mock.calls[0] as unknown as [Blob];
    expect(blob.type).toBe("application/json");
    const saved = parseExportData(await readAsText(blob));
    expect(saved.cards).toHaveLength(2);
    expect(saved.settings).toEqual({
      algorithm: "fsrs",
      desiredRetention: 0.93,
    });
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:deckly");
    expect(await services.dataTransfer.getLastBackupAt()).toBe(NOW);
    await waitFor(() =>
      expect(screen.getByTestId("last-backup")).toHaveTextContent(
        /Último backup: 19\/10\/2026/,
      ),
    );
  });

  it("avisa quando há cartões e nunca houve backup", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    renderApp({ route: "/backup", services });

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Baixe um backup/,
    );
  });

  it("restaura em um navegador vazio, mesclando, e aplica as preferências", async () => {
    const services = createTestServices();
    const { user } = renderApp({ route: "/backup", services });

    await user.upload(
      await screen.findByTestId("import-input"),
      backupFile({ settings: { algorithm: "fsrs", desiredRetention: 0.8 } }),
    );
    expect(await screen.findByTestId("restore-preview")).toHaveTextContent(
      /1 cartões, 1 baralhos/,
    );
    await user.click(screen.getByRole("button", { name: "Restaurar agora" }));

    await waitFor(async () => expect(await services.db.cards.count()).toBe(1));
    expect(await services.algorithm.getActiveAlgorithm()).toBe("fsrs");
    expect(await services.algorithm.getDesiredRetention()).toBe(0.8);
    await waitFor(() =>
      expect(screen.queryByTestId("restore-preview")).not.toBeInTheDocument(),
    );
  });

  it("mesclar mantém os dados atuais e não troca as preferências", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/backup", services });

    await user.upload(
      await screen.findByTestId("import-input"),
      backupFile({ settings: { algorithm: "fsrs", desiredRetention: 0.8 } }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Restaurar agora" }),
    );

    await waitFor(async () => expect(await services.db.cards.count()).toBe(3));
    expect(await services.algorithm.getActiveAlgorithm()).toBe("sm-2");
  });

  it("substituir pede confirmação e troca tudo pelo conteúdo do arquivo", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/backup", services });

    await user.upload(await screen.findByTestId("import-input"), backupFile());
    await user.click(
      await screen.findByRole("radio", { name: /Substituir todos/ }),
    );
    await user.click(screen.getByRole("button", { name: "Restaurar agora" }));
    expect(await services.db.cards.count()).toBe(2);

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Sim, substituir" }),
    );

    await waitFor(async () =>
      expect(
        (await services.db.cards.toArray()).map((card) => card.id),
      ).toEqual(["c9"]),
    );
    expect(await services.db.groups.count()).toBe(0);
  });

  it("cancelar não altera nada", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/backup", services });

    await user.upload(await screen.findByTestId("import-input"), backupFile());
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(screen.queryByTestId("restore-preview")).not.toBeInTheDocument();
    expect(await services.db.cards.count()).toBe(2);
  });

  it("rejeita um arquivo que não é do Deckly sem alterar os dados", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/backup", services });

    await user.upload(
      await screen.findByTestId("import-input"),
      new File(["{}"], "qualquer.json", { type: "application/json" }),
    );

    expect(
      await screen.findByText("Arquivo Deckly inválido"),
    ).toBeInTheDocument();
    expect(await services.db.cards.count()).toBe(2);
  });

  it("restaurar um arquivo sem áudio embutido pede os áudios e vincula pelo nome", async () => {
    const services = createTestServices();
    const { user } = renderApp({ route: "/backup", services });
    const file = backupFile();
    const data = JSON.parse(await readAsText(file));
    data.cards[0].frontAudioFile = "lesson-1.mp3";

    await user.upload(
      await screen.findByTestId("import-input"),
      new File([JSON.stringify(data)], "b.json", { type: "application/json" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Restaurar agora" }),
    );

    expect(
      await screen.findByText(/1 cartão\(ões\) usam áudio/),
    ).toBeInTheDocument();
    await user.upload(
      screen.getByTestId("audio-files-input"),
      new File(["som"], "Lesson-1.MP3", { type: "audio/mpeg" }),
    );

    await waitFor(async () =>
      expect((await services.cards.findById("c9"))?.frontAudioUri).toBe(
        "Lesson-1.MP3",
      ),
    );
  });

  it("pede ao navegador para proteger os dados", async () => {
    const persist = vi.fn(async () => true);
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: { persisted: async () => false, persist },
    });
    const { user } = renderApp({ route: "/backup" });

    await user.click(
      await screen.findByRole("button", { name: "Proteger dados" }),
    );

    expect(persist).toHaveBeenCalledOnce();
    Reflect.deleteProperty(navigator, "storage");
  });
});

describe("lembrete na Home", () => {
  it("aparece com cartões e sem backup, e some depois de um backup recente", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const first = renderApp({ services });

    expect(
      await screen.findByText("Hora de salvar um backup"),
    ).toBeInTheDocument();
    first.unmount();

    await services.dataTransfer.setLastBackupAt(NOW);
    renderApp({ services });
    await screen.findByText(/cartões pendentes/);
    expect(
      screen.queryByText("Hora de salvar um backup"),
    ).not.toBeInTheDocument();
  });

  it("não aparece quando não há cartões", async () => {
    renderApp();

    await screen.findByText(/cartões pendentes/);
    expect(
      screen.queryByText("Hora de salvar um backup"),
    ).not.toBeInTheDocument();
  });
});
