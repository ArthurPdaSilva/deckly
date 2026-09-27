import { createDeckGroupRepository } from "../../../features/decks/groupRepository";

describe("SQLite deck group repository", () => {
  it("lists groups in their persisted order", async () => {
    const database = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn().mockResolvedValue([
        {
          id: "group-1",
          name: "Idiomas",
          created_at: "2026-01-01T10:00:00.000Z",
          updated_at: "2026-01-01T10:00:00.000Z",
          sort_order: 0,
        },
      ]),
    };

    await expect(
      createDeckGroupRepository(database).findAll(),
    ).resolves.toEqual([
      {
        id: "group-1",
        name: "Idiomas",
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
        sortOrder: 0,
      },
    ]);
  });

  it("persists a group and removes it by id", async () => {
    const database = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn(),
    };
    const group = {
      id: "group-1",
      name: "Idiomas",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
      sortOrder: 0,
    };

    const repository = createDeckGroupRepository(database);
    await repository.save(group);
    await repository.remove(group.id);

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO deck_groups"),
      group.id,
      group.name,
      group.createdAt,
      group.updatedAt,
      group.sortOrder,
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM deck_groups WHERE id = ?",
      group.id,
    );
  });
});
