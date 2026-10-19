import {
  formatReviewInterval,
  formatTimeUntil,
} from "../../../features/review/time";

describe("formatTimeUntil", () => {
  const now = new Date("2026-03-15T10:00:00.000Z");

  it.each([
    ["2026-03-15T09:00:00.000Z", "agora"],
    ["2026-03-15T10:30:00.000Z", "em 30 min"],
    ["2026-03-15T13:00:00.000Z", "em 3 h"],
    ["2026-03-17T10:00:00.000Z", "em 2 dias"],
  ])("formats %s as %s", (date, expected) => {
    expect(formatTimeUntil(date, now)).toBe(expected);
  });
});

describe("formatReviewInterval", () => {
  it("uses a friendly label for the next review interval", () => {
    expect(formatReviewInterval(1)).toBe("Revisar amanhã");
    expect(formatReviewInterval(25)).toBe("Revisar em 25 dias");
  });
});
