import { describe, expect, it, vi, afterEach } from "vitest";
import {
  addDays,
  addMonths,
  calculateStreak,
  daysBetween,
  endOfMonth,
  formatLongDate,
  formatShortDate,
  fromIsoDate,
  monthGrid,
  startOfMonth,
  startOfWeek,
  todayLocal,
  toIsoDate,
} from "@/lib/dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("calendar day handling", () => {
  it("reads a stored date as a local calendar day, not a UTC instant", () => {
    const parsed = fromIsoDate("2026-08-18");

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(18);
    expect(toIsoDate(parsed)).toBe("2026-08-18");
  });

  it("uses the local day for today even late at night", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 18, 23, 30));

    expect(todayLocal()).toBe("2026-08-18");
  });

  it("uses the local day for today just after midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 18, 0, 15));

    expect(todayLocal()).toBe("2026-08-18");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-08-18", 7)).toBe("2026-08-25");
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("adds months without rolling past the end of a short month", () => {
    expect(addMonths("2026-08-18", 1)).toBe("2026-09-01");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-01");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-01");
  });

  it("treats Monday as the first day of the week", () => {
    expect(startOfWeek("2026-08-18")).toBe("2026-08-17");
    expect(startOfWeek("2026-08-17")).toBe("2026-08-17");
    expect(startOfWeek("2026-08-16")).toBe("2026-08-10");
  });

  it("finds month boundaries including leap years", () => {
    expect(startOfMonth("2026-08-18")).toBe("2026-08-01");
    expect(endOfMonth("2026-08-18")).toBe("2026-08-31");
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
  });

  it("counts whole days between two dates", () => {
    expect(daysBetween("2026-08-18", "2026-08-25")).toBe(7);
    expect(daysBetween("2026-08-25", "2026-08-18")).toBe(-7);
    expect(daysBetween("2026-08-18", "2026-08-18")).toBe(0);
  });

  it("formats dates for display without shifting the day", () => {
    expect(formatLongDate("2026-08-18")).toBe("August 18, 2026");
    expect(formatShortDate("2026-08-18")).toBe("Aug 18");
    expect(formatLongDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    const active = ["2026-08-18", "2026-08-17", "2026-08-16"];

    expect(calculateStreak(active, "2026-08-18")).toBe(3);
  });

  it("does not break the streak before a full day has passed", () => {
    const active = ["2026-08-17", "2026-08-16"];

    expect(calculateStreak(active, "2026-08-18")).toBe(2);
  });

  it("breaks the streak once a whole day is missed", () => {
    const active = ["2026-08-16", "2026-08-15"];

    expect(calculateStreak(active, "2026-08-18")).toBe(0);
  });

  it("ignores a gap earlier in the history", () => {
    const active = ["2026-08-18", "2026-08-17", "2026-08-14", "2026-08-13"];

    expect(calculateStreak(active, "2026-08-18")).toBe(2);
  });

  it("returns zero when nothing has been logged", () => {
    expect(calculateStreak([], "2026-08-18")).toBe(0);
  });

  it("counts a single day logged today", () => {
    expect(calculateStreak(["2026-08-18"], "2026-08-18")).toBe(1);
  });
});

describe("month grid", () => {
  it("starts on a Monday and covers whole weeks", () => {
    const cells = monthGrid("2026-08-18");

    expect(cells.length % 7).toBe(0);
    expect(cells[0].date).toBe("2026-07-27");
    expect(cells.some((cell) => cell.date === "2026-08-01" && cell.inMonth)).toBe(true);
    expect(cells.some((cell) => cell.date === "2026-08-31" && cell.inMonth)).toBe(true);
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(31);
  });

  it("marks days from neighbouring months as outside the month", () => {
    const cells = monthGrid("2026-08-18");
    const july = cells.find((cell) => cell.date === "2026-07-31");

    expect(july?.inMonth).toBe(false);
  });
});
