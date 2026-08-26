const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Dates are stored as calendar days, so they are always parsed at local midnight
// rather than through Date.parse, which would treat them as UTC instants.
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayLocal(): string {
  return toIsoDate(new Date());
}

export function addDays(value: string, amount: number): string {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

export function addMonths(value: string, amount: number): string {
  const date = fromIsoDate(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return toIsoDate(date);
}

export function startOfWeek(value: string): string {
  const date = fromIsoDate(value);
  const weekday = (date.getDay() + 6) % 7;
  return addDays(value, -weekday);
}

export function endOfWeek(value: string): string {
  return addDays(startOfWeek(value), 6);
}

export function startOfMonth(value: string): string {
  const date = fromIsoDate(value);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonth(value: string): string {
  const date = fromIsoDate(value);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function daysBetween(from: string, to: string): number {
  const start = fromIsoDate(from);
  const end = fromIsoDate(to);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function formatLongDate(value: string): string {
  return fromIsoDate(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(value: string): string {
  return fromIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatMonthTitle(value: string): string {
  return fromIsoDate(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

// A streak stays alive until a whole day passes with nothing logged, so a day
// with no activity yet still reports the streak that ended yesterday.
export function calculateStreak(activeDates: Iterable<string>, today: string): number {
  const active = new Set(activeDates);
  let cursor = active.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (active.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

// ISO date strings sort chronologically, so a plain sort is enough to walk a
// log in order.
function sortedUniqueDates(activeDates: Iterable<string>): string[] {
  return [...new Set(activeDates)].sort();
}

export function longestStreak(activeDates: Iterable<string>): number {
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of sortedUniqueDates(activeDates)) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    previous = date;
    if (run > longest) {
      longest = run;
    }
  }

  return longest;
}

// The number of fully inactive days in the widest quiet stretch between two
// active days. A log with fewer than two active days has no gap to measure.
export function longestGap(activeDates: Iterable<string>): number {
  const dates = sortedUniqueDates(activeDates);
  let longest = 0;

  for (let index = 1; index < dates.length; index += 1) {
    const gap = daysBetween(dates[index - 1], dates[index]) - 1;
    if (gap > longest) {
      longest = gap;
    }
  }

  return longest;
}

export interface CalendarCell {
  date: string;
  inMonth: boolean;
}

export function monthGrid(monthAnchor: string): CalendarCell[] {
  const first = startOfMonth(monthAnchor);
  const last = endOfMonth(monthAnchor);
  const gridStart = startOfWeek(first);
  const cells: CalendarCell[] = [];

  let cursor = gridStart;
  while (cursor <= last || cells.length % 7 !== 0) {
    cells.push({ date: cursor, inMonth: cursor >= first && cursor <= last });
    cursor = addDays(cursor, 1);
  }

  return cells;
}
