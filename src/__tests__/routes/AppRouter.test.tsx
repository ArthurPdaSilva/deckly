import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { AppRouter } from "../../routes/AppRouter";
import { ThemeProvider } from "../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

describe("AppRouter", () => {
  it("navigates to progress and returns to decks", async () => {
    const database = {
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue({ count: 0, average: null }),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <AppRouter />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("Nenhum baralho criado ainda.")).toBeTruthy(),
    );
    fireEvent.press(screen.getByText("Ver progresso"));
    await waitFor(() => expect(screen.getByText("Seu progresso")).toBeTruthy());

    fireEvent.press(screen.getByText("← Voltar aos baralhos"));
    await waitFor(() => {
      expect(screen.getByText("Seus baralhos")).toBeTruthy();
      expect(screen.getByText("Nenhum baralho criado ainda.")).toBeTruthy();
    });
  });
});
