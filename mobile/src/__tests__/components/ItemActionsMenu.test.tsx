import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ItemActionsMenu } from "../../components/ItemActionsMenu";
import { ThemeProvider } from "../../styles/ThemeProvider";

function renderMenu(
  actions = [
    { label: "Editar", onPress: jest.fn() },
    { label: "Excluir", onPress: jest.fn(), destructive: true },
  ],
) {
  const screen = render(
    <ThemeProvider mode="light">
      <ItemActionsMenu actions={actions} testID="menu" title="Inglês" />
    </ThemeProvider>,
  );
  return { screen, actions };
}

describe("ItemActionsMenu", () => {
  it("keeps the actions hidden until the gear is pressed", () => {
    const { screen } = renderMenu();

    expect(screen.getByLabelText("Opções")).toBeTruthy();
    expect(screen.queryByText("Editar")).toBeNull();
    expect(screen.queryByText("Excluir")).toBeNull();

    fireEvent.press(screen.getByTestId("menu"));

    expect(screen.getByText("Inglês")).toBeTruthy();
    expect(screen.getByText("Editar")).toBeTruthy();
    expect(screen.getByText("Excluir")).toBeTruthy();
  });

  it("closes the menu and runs the chosen action", async () => {
    const { screen, actions } = renderMenu();

    fireEvent.press(screen.getByTestId("menu"));
    fireEvent.press(screen.getByText("Excluir"));

    await waitFor(() => expect(actions[1].onPress).toHaveBeenCalledTimes(1));
    expect(actions[0].onPress).not.toHaveBeenCalled();
    expect(screen.queryByText("Excluir")).toBeNull();
  });

  it("closes without running anything when the backdrop is pressed", () => {
    const { screen, actions } = renderMenu();

    fireEvent.press(screen.getByTestId("menu"));
    fireEvent.press(screen.getByLabelText("Cancelar"));

    expect(screen.queryByText("Editar")).toBeNull();
    expect(actions[0].onPress).not.toHaveBeenCalled();
    expect(actions[1].onPress).not.toHaveBeenCalled();
  });
});
