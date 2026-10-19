import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createTestServices,
  FIXED_NOW,
  renderApp,
  seedBasicData,
} from "../../test/helpers";

describe("tela de progresso", () => {
  it("mostra as métricas e a distribuição das avaliações", async () => {
    const services = createTestServices();
    await seedBasicData(services, { cards: 2 });
    const reviewed = (id: string, rating: number) => ({
      id,
      cardId: "card-1",
      reviewedAt: FIXED_NOW.toISOString(),
      rating,
      previousIntervalDays: 0,
      nextIntervalDays: 1,
      algorithm: "sm-2",
      algorithmVersion: "1",
    });
    await services.db.reviews.bulkAdd([
      reviewed("r1", 4),
      reviewed("r2", 4),
      reviewed("r3", 2),
    ]);

    renderApp({ route: "/statistics", services });

    expect(await screen.findByText("3 revisões hoje")).toBeInTheDocument();
    const metrics = screen.getAllByRole("term");
    expect(metrics.map((term) => term.textContent)).toEqual([
      "cartões criados",
      "para revisar",
      "média das avaliações",
      "baralhos",
    ]);
    expect(
      within(metrics[0]?.parentElement as HTMLElement).getByText("2"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("rating-fill-4").style.width).toMatch(/^66\.6/);
    expect(screen.getByTestId("rating-fill-5")).toHaveStyle({ width: "0%" });
  });
});
