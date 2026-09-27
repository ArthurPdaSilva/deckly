import { createAlgorithmRepository } from "../../../features/review/algorithmRepository";

describe("algorithm repository", () => {
  it("defaults to SM-2 and persists the selected algorithm", async () => {
    const database = {
      getFirstAsync: jest.fn().mockResolvedValue(null),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };
    const repository = createAlgorithmRepository(database);

    await expect(repository.getActiveAlgorithm()).resolves.toBe("sm-2");
    await repository.setActiveAlgorithm("fsrs");

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO app_state"),
      "review_algorithm",
      "fsrs",
    );
  });

  it("resets scheduling state without touching review history", async () => {
    const database = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue(undefined),
    };

    await createAlgorithmRepository(database).resetSchedule(
      "fsrs",
      "2026-03-15T10:00:00.000Z",
    );

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE cards SET due_at"),
      "2026-03-15T10:00:00.000Z",
      "fsrs",
    );
    expect(database.runAsync.mock.calls[0][0]).not.toContain("review_history");
  });
});
