import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createTestServices, renderApp, seedBasicData } from "../test/helpers";

describe("navegação", () => {
  it("mostra a quantidade de cartões pendentes e os atalhos da Home", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 3 });
    renderApp({ services });

    expect(await screen.findByText("3 cartões pendentes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Começar revisão" }),
    ).toHaveAttribute("href", "/review");
    expect(
      within(screen.getByRole("main")).getByRole("link", {
        name: "Meus baralhos",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("main")).getByRole("link", {
        name: "Ver progresso",
      }),
    ).toBeInTheDocument();
  });

  it("mostra a página 404 para rotas desconhecidas", async () => {
    renderApp({ route: "/nao-existe" });

    expect(await screen.findByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para o início" }),
    ).toBeInTheDocument();
  });

  it("exibe a interface em inglês quando o idioma é inglês", async () => {
    renderApp({ language: "en" });

    expect(await screen.findByText("0 cards pending")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start review" }),
    ).toBeInTheDocument();
  });
});

describe("grupos", () => {
  it("cria um grupo e o mostra na lista", async () => {
    const { user } = renderApp({ route: "/groups/new" });

    await user.click(
      await screen.findByRole("button", { name: "Criar grupo" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O nome do grupo não pode ficar vazio",
    );

    await user.type(
      screen.getByLabelText("Nome do grupo"),
      "Direito Constitucional",
    );
    await user.click(screen.getByRole("button", { name: "Criar grupo" }));

    expect(
      await screen.findByRole("link", { name: "Direito Constitucional" }),
    ).toBeInTheDocument();
  });

  it("exclui um grupo depois da confirmação e mantém os baralhos sem grupo", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/groups", services });

    await user.click(
      await screen.findByRole("button", { name: "Opções: Concursos" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Excluir este grupo?")).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar exclusão" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Concursos" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByRole("link", { name: "Sem grupo" }),
    ).toBeInTheDocument();
    expect((await services.decks.findAll())[0]?.groupId).toBeNull();
  });

  it("cancela a exclusão sem apagar nada", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/groups", services });

    await user.click(
      await screen.findByRole("button", { name: "Opções: Concursos" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await services.groups.findAll()).toHaveLength(1);
  });
});

describe("baralhos", () => {
  it("lista os baralhos do grupo com o resumo da revisão", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    renderApp({ route: "/groups/group-1/decks", services });

    expect(await screen.findByText("Português")).toBeInTheDocument();
    expect(screen.getByText("Ortografia")).toBeInTheDocument();
    expect(screen.getByText(/2 para revisar/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar grupo" })).toHaveAttribute(
      "href",
      "/review/group/group-1",
    );
  });

  it("cria um baralho dentro do grupo escolhido", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/decks/new?group=group-1", services });

    await user.click(
      await screen.findByRole("button", { name: "Criar baralho" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O nome do baralho não pode ficar vazio",
    );

    await user.type(screen.getByLabelText("Nome do baralho"), "Informática");
    await user.type(screen.getByLabelText("Descrição (opcional)"), "Redes");
    await user.click(screen.getByRole("button", { name: "Criar baralho" }));

    expect(await screen.findByText("Informática")).toBeInTheDocument();
    const created = (await services.decks.findAll()).find(
      (deck) => deck.name === "Informática",
    );
    expect(created).toMatchObject({ groupId: "group-1", description: "Redes" });
  });

  it("move o baralho para outro grupo ao editar", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/decks/deck-1/edit", services });

    await user.selectOptions(await screen.findByLabelText("Grupo"), "");
    await user.click(screen.getByRole("button", { name: "Salvar baralho" }));

    await waitFor(async () =>
      expect((await services.decks.findAll())[0]?.groupId).toBeNull(),
    );
  });

  it("exclui um baralho com seus cartões", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/groups/group-1/decks", services });

    await user.click(
      await screen.findByRole("button", { name: "Opções: Português" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }));
    await user.click(
      screen.getByRole("button", { name: "Confirmar exclusão" }),
    );

    await waitFor(async () =>
      expect(await services.decks.findAll()).toHaveLength(0),
    );
    expect(await services.db.cards.count()).toBe(0);
  });
});

describe("cartões", () => {
  it("lista os cartões do baralho", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    renderApp({ route: "/decks/deck-1/cards", services });

    expect(await screen.findByText("Pergunta 1")).toBeInTheDocument();
    expect(screen.getByText("Resposta 2")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Revisar este baralho" }),
    ).toBeInTheDocument();
  });

  it("cria um cartão validando frente e verso", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 0 });
    const { user } = renderApp({ route: "/decks/deck-1/cards/new", services });

    await user.click(
      await screen.findByRole("button", { name: "Criar cartão" }),
    );
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      "A frente do cartão não pode ficar vazia",
      "O verso do cartão não pode ficar vazio",
    ]);

    await user.type(
      screen.getByLabelText("Frente do cartão"),
      "Acentuação de 'ideia'",
    );
    await user.type(
      screen.getByLabelText("Verso do cartão"),
      "Não leva acento",
    );
    await user.click(screen.getByRole("button", { name: "Criar cartão" }));

    expect(
      await screen.findByText("Acentuação de 'ideia'"),
    ).toBeInTheDocument();
    expect(await services.cards.findByDeckId("deck-1")).toHaveLength(1);
  });

  it("anexa um áudio à pergunta ao criar o cartão", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 0 });
    const { user } = renderApp({ route: "/decks/deck-1/cards/new", services });

    await user.type(await screen.findByLabelText("Frente do cartão"), "Listen");
    await user.type(screen.getByLabelText("Verso do cartão"), "Ouça");
    await user.upload(
      screen.getByTestId("audio-input"),
      new File(["som"], "lesson.mp3", { type: "audio/mpeg" }),
    );
    expect(screen.getByText("Áudio anexado: lesson.mp3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar cartão" }));

    await waitFor(async () => {
      const [card] = await services.cards.findByDeckId("deck-1");
      expect(card?.frontAudioUri).toBe("lesson.mp3");
    });
    const [card] = await services.cards.findByDeckId("deck-1");
    expect((await services.cards.findAudio(card?.id ?? ""))?.type).toBe(
      "audio/mpeg",
    );
  });

  it("edita um cartão existente", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/cards/card-1/edit", services });

    const front = await screen.findByLabelText("Frente do cartão");
    expect(front).toHaveValue("Pergunta 1");
    await user.clear(front);
    await user.type(front, "Pergunta corrigida");
    await user.click(screen.getByRole("button", { name: "Salvar cartão" }));

    expect(await screen.findByText("Pergunta corrigida")).toBeInTheDocument();
  });

  it("move o cartão para outro baralho mantendo o progresso", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });
    await services.decks.save({
      id: "deck-2",
      name: "Direito",
      description: "",
      groupId: "group-1",
      sortOrder: 1,
      createdAt: "2026-10-02T10:00:00.000Z",
      updatedAt: "2026-10-02T10:00:00.000Z",
    });
    await services.db.cards.update("card-1", { repetitions: 4 });
    const { user } = renderApp({ route: "/cards/card-1/move", services });

    expect(
      await screen.findByText("Baralho atual: Português"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mover" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Direito" }));
    await user.click(screen.getByRole("button", { name: "Mover" }));

    await waitFor(async () =>
      expect((await services.cards.findById("card-1"))?.deckId).toBe("deck-2"),
    );
    expect((await services.cards.findById("card-1"))?.repetitions).toBe(4);
  });

  it("avisa quando não há outro baralho para mover o cartão", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });
    renderApp({ route: "/cards/card-1/move", services });

    expect(
      await screen.findByText(
        "Crie outro baralho para poder mover este cartão.",
      ),
    ).toBeInTheDocument();
  });

  it("exclui um cartão depois da confirmação", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });
    const { user } = renderApp({ route: "/decks/deck-1/cards", services });

    await user.click(
      await screen.findByRole("button", { name: /Opções: Pergunta 1/ }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }));
    await user.click(
      screen.getByRole("button", { name: "Confirmar exclusão" }),
    );

    expect(
      await screen.findByText("Nenhum cartão criado ainda."),
    ).toBeInTheDocument();
    expect(await services.db.cards.count()).toBe(0);
  });
});
