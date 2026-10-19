import Toast from "react-native-toast-message";
import { notify } from "../../components/notifications";

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

describe("notify", () => {
  beforeEach(() => {
    jest.mocked(Toast.show).mockClear();
  });

  it.each([
    ["success", "Sucesso"],
    ["error", "Erro"],
    ["info", "Aviso"],
  ] as const)("shows a %s toast", (type, title) => {
    notify[type]("Mensagem de teste");

    expect(Toast.show).toHaveBeenCalledWith({
      type,
      text1: title,
      text2: "Mensagem de teste",
    });
  });
});
