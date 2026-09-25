import { render, waitFor } from "@testing-library/react-native";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import type { ReactNode } from "react";
import { App } from "../../App";

jest.mock("expo-sqlite", () => ({
  SQLiteProvider: ({ children }: { children: ReactNode }) => children,
  useSQLiteContext: jest.fn(),
}));

describe("App", () => {
  it("renders the initial Deckly shell", async () => {
    jest.mocked(useSQLiteContext).mockReturnValue({
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn().mockResolvedValue(undefined),
    } as never);
    const screen = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Seus baralhos")).toBeTruthy();
      expect(screen.getByText("Nenhum baralho criado ainda.")).toBeTruthy();
    });
    expect(SQLiteProvider).toBeDefined();
  });
});
