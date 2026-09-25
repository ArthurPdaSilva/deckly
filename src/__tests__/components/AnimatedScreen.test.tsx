import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { AnimatedScreen } from "../../components/AnimatedScreen";

describe("AnimatedScreen", () => {
  it("renders its content inside the animated transition", () => {
    const screen = render(
      <AnimatedScreen>
        <Text>Conteúdo da tela</Text>
      </AnimatedScreen>,
    );

    expect(screen.getByText("Conteúdo da tela")).toBeTruthy();
  });
});
