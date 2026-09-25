import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { ReviewScreen } from "../../../features/review/ReviewScreen";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

describe("ReviewScreen", () => {
  it("reveals the answer and records an easy review", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "card-1",
          deck_id: "deck-1",
          front: "Hello",
          back: "Olá",
          due_at: "2026-03-01T09:00:00.000Z",
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
          created_at: "2026-02-01T10:00:00.000Z",
          updated_at: "2026-02-01T10:00:00.000Z",
        },
      ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <ReviewScreen
          onBack={jest.fn()}
          now={new Date("2026-03-01T10:00:00.000Z")}
        />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    expect(screen.getByText("Cartão 1 de 1")).toBeTruthy();
    expect(screen.getByTestId("review-progress-fill")).toBeTruthy();
    expect(screen.getByTestId("review-content").props.style).toEqual(
      expect.objectContaining({ justifyContent: "flex-start" }),
    );
    expect(screen.queryByText("Olá")).toBeNull();
    fireEvent.press(screen.getByText("Mostrar resposta"));
    expect(screen.getByText("Olá")).toBeTruthy();
    fireEvent.press(screen.getByText("Fácil"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith("BEGIN");
      expect(database.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO review_history"),
        expect.any(String),
        "card-1",
        "2026-03-01T10:00:00.000Z",
        5,
        0,
        1,
        "sm-2",
        "1",
      );
    });
    expect(screen.getByText("Sessão concluída")).toBeTruthy();
    expect(screen.getByText("1 cartão revisado.")).toBeTruthy();
  });

  it("shows the next card and advances the progress", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "card-1",
          deck_id: "deck-1",
          front: "Hello",
          back: "Olá",
          due_at: "2026-03-01T09:00:00.000Z",
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
          created_at: "2026-02-01T10:00:00.000Z",
          updated_at: "2026-02-01T10:00:00.000Z",
        },
        {
          id: "card-2",
          deck_id: "deck-1",
          front: "Goodbye",
          back: "Tchau",
          due_at: "2026-03-01T09:30:00.000Z",
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
          created_at: "2026-02-01T10:00:00.000Z",
          updated_at: "2026-02-01T10:00:00.000Z",
        },
      ]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <ReviewScreen
          onBack={jest.fn()}
          now={new Date("2026-03-01T10:00:00.000Z")}
        />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Hello")).toBeTruthy());
    fireEvent.press(screen.getByText("Mostrar resposta"));
    fireEvent.press(screen.getByText("Fácil"));

    await waitFor(() => {
      expect(screen.getByText("Goodbye")).toBeTruthy();
      expect(screen.getByText("Cartão 2 de 2")).toBeTruthy();
    });
  });
});
