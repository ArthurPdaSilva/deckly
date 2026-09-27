import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { GroupsScreen } from "../../../features/decks/GroupsScreen";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

function groupRow(id: string, name: string) {
  return {
    id,
    name,
    created_at: "2026-02-01T10:00:00.000Z",
    updated_at: "2026-02-01T10:00:00.000Z",
    sort_order: 0,
  };
}

describe("GroupsScreen", () => {
  it("asks for confirmation before deleting a group and keeps it when cancelled", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn((sql: string) =>
        Promise.resolve(
          sql.includes("FROM deck_groups")
            ? [groupRow("group-1", "Idiomas")]
            : [],
        ),
      ),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <GroupsScreen onBack={jest.fn()} onNavigate={jest.fn()} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Idiomas")).toBeTruthy());
    fireEvent.press(screen.getByText("Excluir grupo"));

    expect(screen.getByText("Excluir este grupo?")).toBeTruthy();
    fireEvent.press(screen.getByText("Cancelar"));

    expect(database.runAsync).not.toHaveBeenCalled();
    expect(screen.getByText("Idiomas")).toBeTruthy();
  });

  it("deletes the group after confirmation", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn((sql: string) =>
        Promise.resolve(
          sql.includes("FROM deck_groups")
            ? [groupRow("group-1", "Idiomas")]
            : [],
        ),
      ),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <GroupsScreen onBack={jest.fn()} onNavigate={jest.fn()} />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Idiomas")).toBeTruthy());
    fireEvent.press(screen.getByText("Excluir grupo"));
    fireEvent.press(screen.getByText("Confirmar exclusão"));

    await waitFor(() => {
      expect(database.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM deck_groups"),
        "group-1",
      );
    });
  });
});
