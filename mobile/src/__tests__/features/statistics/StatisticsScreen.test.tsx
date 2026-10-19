import { render, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { StatisticsScreen } from "../../../features/statistics/StatisticsScreen";
import { ThemeProvider } from "../../../styles/ThemeProvider";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

describe("StatisticsScreen", () => {
  it("displays the local progress metrics", async () => {
    const database = {
      getFirstAsync: jest
        .fn()
        .mockResolvedValueOnce({ count: 3 })
        .mockResolvedValueOnce({ count: 24 })
        .mockResolvedValueOnce({ count: 5 })
        .mockResolvedValueOnce({ count: 4 })
        .mockResolvedValueOnce({ average: 4.25 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };
    jest.mocked(useSQLiteContext).mockReturnValue(database as never);

    const screen = render(
      <ThemeProvider mode="light">
        <StatisticsScreen
          onBack={jest.fn()}
          now={new Date("2026-03-15T14:30:00.000Z")}
        />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Seu progresso")).toBeTruthy());
    expect(screen.getByText("24")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("4.3")).toBeTruthy();
    expect(screen.getByText("4 revisões hoje")).toBeTruthy();
  });
});
