import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resetAndSeedDatabase } from "../../db/seed";
import {
  createTestServices,
  FIXED_NOW,
  renderApp,
  seedBasicData,
} from "../../test/helpers";

describe("configurações", () => {
  it("alterna o tema claro e escuro", async () => {
    const { user } = renderApp({ route: "/settings" });

    await user.click(
      await screen.findByRole("button", { name: "Usar tema escuro" }),
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Usar tema claro" }),
    ).toBeInTheDocument();
  });

  it("troca o idioma da interface", async () => {
    const { user } = renderApp({ route: "/settings" });

    await user.click(await screen.findByRole("button", { name: "English" }));

    expect(
      await screen.findByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("troca o algoritmo só depois de confirmar e libera a retenção do FSRS", async () => {
    const services = createTestServices();
    const { user } = renderApp({ route: "/settings", services });

    await user.click(await screen.findByRole("button", { name: "FSRS" }));
    expect(await services.algorithm.getActiveAlgorithm()).toBe("sm-2");
    expect(screen.getByText(/Você deseja aplicar FSRS/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar troca" }));
    await waitFor(async () =>
      expect(await services.algorithm.getActiveAlgorithm()).toBe("fsrs"),
    );

    expect(screen.getByTestId("retention-value")).toHaveTextContent("90%");
    await user.click(screen.getByRole("button", { name: "Aumentar retenção" }));
    await waitFor(() =>
      expect(screen.getByTestId("retention-value")).toHaveTextContent("91%"),
    );
    expect(await services.algorithm.getDesiredRetention()).toBe(0.91);
  });

  it("não deixa a retenção passar de 97%", async () => {
    const services = createTestServices();
    await services.algorithm.setActiveAlgorithm("fsrs");
    await services.algorithm.setDesiredRetention(0.97);
    const { user } = renderApp({ route: "/settings", services });

    await screen.findByRole("button", { name: "Aumentar retenção" });
    await waitFor(() =>
      expect(screen.getByTestId("retention-value")).toHaveTextContent("97%"),
    );
    await user.click(screen.getByRole("button", { name: "Aumentar retenção" }));

    expect(screen.getByTestId("retention-value")).toHaveTextContent("97%");
    expect(await services.algorithm.getDesiredRetention()).toBe(0.97);
  });

  it("reinicia o agendamento depois da confirmação", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });
    await services.db.cards.update("card-1", {
      repetitions: 5,
      intervalDays: 20,
    });
    const { user } = renderApp({ route: "/settings", services });

    await user.click(
      await screen.findByRole("button", { name: "Reiniciar agendamento" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar reinício" }),
    );

    await waitFor(async () =>
      expect((await services.db.cards.get("card-1"))?.repetitions).toBe(0),
    );
  });

  it("apaga todos os dados depois da confirmação", async () => {
    const services = createTestServices();
    await seedBasicData(services);
    const { user } = renderApp({ route: "/settings", services });

    await user.click(
      await screen.findByRole("button", { name: "Apagar tudo" }),
    );
    await user.click(screen.getByRole("button", { name: "Sim, apagar tudo" }));

    await waitFor(async () => expect(await services.db.cards.count()).toBe(0));
    expect(await services.db.decks.count()).toBe(0);
    expect(await services.db.groups.count()).toBe(0);
  });

  it("esconde os dados de teste fora do modo de desenvolvimento", async () => {
    renderApp({ route: "/settings" });

    await screen.findByRole("heading", { name: "Configurações" });
    expect(
      screen.queryByRole("button", { name: "Carregar dados de teste" }),
    ).not.toBeInTheDocument();
  });

  it("leva para a página de backup", async () => {
    renderApp({ route: "/settings" });

    expect(
      await screen.findByRole("link", { name: "Backup e restauração" }),
    ).toHaveAttribute("href", "/backup");
  });
});

describe("dados de teste", () => {
  it("substitui os dados locais pela seed", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 1 });

    await resetAndSeedDatabase(services.db, FIXED_NOW);

    expect(await services.db.groups.count()).toBe(3);
    expect(await services.db.decks.count()).toBe(9);
    expect(await services.db.cards.count()).toBe(33);
    expect(await services.db.cards.get("card-1")).toBeUndefined();
    expect(
      await services.reviews.countDueCards(FIXED_NOW.toISOString()),
    ).toBeGreaterThan(0);
  });
});
