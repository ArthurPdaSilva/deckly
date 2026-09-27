import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { SettingsScreen } from "../../../features/settings/SettingsScreen";
import { LanguageProvider } from "../../../styles/LanguageProvider";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

describe("SettingsScreen", () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_DEV_MODE = "true";
  });

  afterAll(() => {
    delete process.env.EXPO_PUBLIC_DEV_MODE;
  });

  it("loads development seed data from settings", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <LanguageProvider database={database}>
        <ThemeProvider mode="light">
          <SettingsScreen onBack={jest.fn()} />
        </ThemeProvider>
      </LanguageProvider>,
    );

    fireEvent.press(screen.getByText("Carregar dados de teste"));
    expect(
      screen.getByText(
        "Todos os dados locais atuais serão apagados e substituídos pela seed.",
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByText("Confirmar"));

    await waitFor(() => {
      expect(database.execAsync).toHaveBeenCalledWith("BEGIN");
    });
  });

  it("selects and persists English", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <LanguageProvider database={database}>
        <ThemeProvider mode="light">
          <SettingsScreen onBack={jest.fn()} />
        </ThemeProvider>
      </LanguageProvider>,
    );

    fireEvent.press(screen.getByText("English"));

    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByText("Appearance")).toBeTruthy();
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO app_state"),
      "language",
      "en",
    );
  });
});
