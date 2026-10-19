import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createTestServices,
  makeCard,
  renderApp,
  seedBasicData,
} from "../../test/helpers";

const flip = { name: "↻ Virar carta" };

describe("tela de revisão", () => {
  it("avisa quando não há nada para revisar", async () => {
    renderApp({ route: "/review" });

    expect(
      await screen.findByText("Tudo revisado por hoje."),
    ).toBeInTheDocument();
  });

  it("mostra a frente, vira a carta e registra a avaliação", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 2 });
    const { user } = renderApp({ route: "/review", services });

    expect(await screen.findByText("Cartão 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Pergunta 1")).toBeInTheDocument();
    expect(screen.queryByText("Resposta 1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", flip));
    expect(screen.getByText("Resposta 1")).toBeInTheDocument();

    // Os botões mostram só o nome da avaliação, sem o próximo intervalo.
    expect(
      screen.getByRole("button", { name: /^De novo$/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Bom$/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Bom/ }));

    expect(await screen.findByText("Cartão 2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Pergunta 2")).toBeInTheDocument();
    expect(screen.getByTestId("review-progress-fill")).toHaveStyle({
      width: "50%",
    });

    const reviews = await services.db.reviews.toArray();
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      cardId: "card-1",
      rating: 4,
      algorithm: "sm-2",
    });
    expect(await services.db.cards.get("card-1")).toMatchObject({
      repetitions: 1,
      intervalDays: 1,
      dueAt: "2026-10-20T12:00:00.000Z",
    });
  });

  it("conclui a sessão e mostra o resumo", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 2 });
    const { user } = renderApp({ route: "/review", services });

    for (let index = 0; index < 2; index += 1) {
      await screen.findByText(`Cartão ${index + 1} de 2`);
      await user.click(await screen.findByRole("button", flip));
      await user.click(screen.getByRole("button", { name: /^Fácil/ }));
    }

    const summary = await screen.findByTestId("review-completion-card");
    expect(within(summary).getByText("Sessão concluída")).toBeInTheDocument();
    expect(
      within(summary).getByText("2 cartões revisados."),
    ).toBeInTheDocument();
    expect(await services.db.reviews.count()).toBe(2);
  });

  it("devolve à fila o cartão errado, que volta em 1 minuto", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 2 });
    const { user } = renderApp({ route: "/review", services });

    await user.click(await screen.findByRole("button", flip));
    await user.click(screen.getByRole("button", { name: /^De novo/ }));

    expect(await screen.findByText("Pergunta 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", flip));
    await user.click(screen.getByRole("button", { name: /^Bom/ }));

    // O primeiro cartão reaparece no fim da fila.
    expect(await screen.findByText("Pergunta 1")).toBeInTheDocument();
  });

  it("avalia com as teclas 1 a 4 depois de virar a carta", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });
    const { user } = renderApp({ route: "/review", services });

    await user.click(await screen.findByRole("button", flip));
    await user.keyboard("4");

    expect(
      await screen.findByTestId("review-completion-card"),
    ).toBeInTheDocument();
    expect((await services.db.reviews.toArray())[0]?.rating).toBe(5);
  });

  it("revisa só o baralho escolhido", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });
    await services.decks.save({
      id: "deck-2",
      name: "Direito",
      description: "",
      groupId: null,
      createdAt: "2026-10-02T10:00:00.000Z",
      updatedAt: "2026-10-02T10:00:00.000Z",
    });
    await services.cards.save(
      makeCard({ id: "other", deckId: "deck-2", front: "Outro baralho" }),
    );
    renderApp({ route: "/review/deck/deck-1", services });

    expect(await screen.findByText("Cartão 1 de 1")).toBeInTheDocument();
    expect(screen.getByText("Pergunta 1")).toBeInTheDocument();
    expect(screen.getByText("REVISÃO • PORTUGUÊS")).toBeInTheDocument();
  });

  it("revisa os baralhos de um grupo", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 2 });
    renderApp({ route: "/review/group/group-1", services });

    expect(await screen.findByText("Cartão 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("GRUPO • CONCURSOS")).toBeInTheDocument();
  });

  it("usa o FSRS quando ele é o algoritmo ativo", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });
    await services.algorithm.setActiveAlgorithm("fsrs");
    const { user } = renderApp({ route: "/review", services });

    await user.click(await screen.findByRole("button", flip));
    expect(
      screen.getByRole("button", { name: /^De novo$/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Bom$/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Bom/ }));

    await screen.findByTestId("review-completion-card");
    const [review] = await services.db.reviews.toArray();
    expect(review).toMatchObject({ algorithm: "fsrs", algorithmVersion: "6" });
    expect(await services.db.cards.get("card-1")).toMatchObject({
      schedulerAlgorithm: "fsrs",
    });
  });
});
