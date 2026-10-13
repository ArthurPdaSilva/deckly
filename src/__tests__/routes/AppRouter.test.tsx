import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import Toast from "react-native-toast-message";
import { AppRouter } from "../../routes/AppRouter";
import { ThemeProvider } from "../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

describe("AppRouter", () => {
  it("starts at home and navigates to progress and settings", async () => {
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

    expect(screen.getByText("Início")).toBeTruthy();
    fireEvent.press(screen.getByText("Meus baralhos"));
    await waitFor(() =>
      expect(screen.getByText("Nenhum grupo criado ainda.")).toBeTruthy(),
    );
    fireEvent.press(screen.getByText("← Voltar ao início"));
    fireEvent.press(screen.getByText("Ver progresso"));
    await waitFor(() => expect(screen.getByText("Seu progresso")).toBeTruthy());

    fireEvent.press(screen.getByText("← Voltar aos baralhos"));
    await waitFor(() => expect(screen.getByText("Início")).toBeTruthy());
    expect(screen.getByText("Início")).toBeTruthy();
    fireEvent.press(screen.getByText("Configurações"));
    expect(screen.getByText("Configurações")).toBeTruthy();
  });

  it("returns to the groups list with the new group and a success message", async () => {
    const groups: Record<string, unknown>[] = [];
    const database = {
      getAllAsync: jest.fn((sql: string) =>
        Promise.resolve(sql.includes("FROM deck_groups") ? [...groups] : []),
      ),
      getFirstAsync: jest.fn().mockResolvedValue({ count: 0, average: null }),
      runAsync: jest.fn((sql: string, ...params: unknown[]) => {
        if (sql.includes("INSERT INTO deck_groups")) {
          groups.push({
            id: params[0],
            name: params[1],
            created_at: params[2],
            updated_at: params[3],
            sort_order: params[4],
          });
        }
        return Promise.resolve(undefined);
      }),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);
    jest.mocked(Toast.show).mockClear();

    const screen = render(
      <ThemeProvider mode="light">
        <AppRouter />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText("Meus baralhos"));
    await waitFor(() =>
      expect(screen.getByText("Nenhum grupo criado ainda.")).toBeTruthy(),
    );
    fireEvent.press(screen.getByText("Novo grupo"));
    fireEvent.changeText(screen.getByLabelText("Nome do grupo"), "Idiomas");
    fireEvent.press(screen.getByText("Criar grupo"));

    await waitFor(() => expect(screen.getByText("Idiomas")).toBeTruthy());
    expect(screen.queryByText("Nenhum grupo criado ainda.")).toBeNull();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success" }),
    );
  });

  it("keeps the form open and shows an error message when creation fails", async () => {
    const database = {
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue({ count: 0, average: null }),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);
    jest.mocked(Toast.show).mockClear();

    const screen = render(
      <ThemeProvider mode="light">
        <AppRouter />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText("Meus baralhos"));
    await waitFor(() => expect(screen.getByText("Novo grupo")).toBeTruthy());
    fireEvent.press(screen.getByText("Novo grupo"));
    fireEvent.press(screen.getByText("Criar grupo"));

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" }),
      ),
    );
    expect(screen.getByLabelText("Nome do grupo")).toBeTruthy();
  });
});
