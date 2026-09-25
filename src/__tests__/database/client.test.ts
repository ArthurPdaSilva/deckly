import { openDatabaseAsync } from "expo-sqlite";
import { openDecklyDatabase } from "../../database/client";

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

describe("database client", () => {
  it("opens the local database, enables foreign keys and runs migrations", async () => {
    const database = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 1 }),
    };
    jest.mocked(openDatabaseAsync).mockResolvedValue(database as never);

    await expect(openDecklyDatabase()).resolves.toBe(database);

    expect(openDatabaseAsync).toHaveBeenCalledWith("deckly.db");
    expect(database.execAsync).toHaveBeenCalledWith("PRAGMA foreign_keys = ON");
  });
});
