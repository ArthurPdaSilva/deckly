import { render } from "@testing-library/react-native";
import { SQLiteProvider } from "expo-sqlite";
import type { ReactNode } from "react";
import { App } from "../../App";

jest.mock("expo-sqlite", () => ({
  SQLiteProvider: ({ children }: { children: ReactNode }) => children,
}));

describe("App", () => {
  it("renders the initial Deckly shell", () => {
    const screen = render(<App />);

    expect(screen.getByText("Deckly")).toBeTruthy();
    expect(SQLiteProvider).toBeDefined();
  });
});
