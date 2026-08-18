import { endOfMonth, startOfMonth, startOfWeek, endOfWeek } from "./dates";
import { DIFFICULTIES, type Difficulty } from "./types";

export const SORT_KEYS = [
  "newest",
  "oldest",
  "title-asc",
  "title-desc",
  "difficulty",
  "repeats",
  "platform",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Date completed, newest",
  oldest: "Date completed, oldest",
  "title-asc": "Title A to Z",
  "title-desc": "Title Z to A",
  difficulty: "Difficulty",
  repeats: "Most repeated",
  platform: "Platform",
};

export const REPEAT_FILTERS = ["all", "never", "repeated"] as const;
export type RepeatFilter = (typeof REPEAT_FILTERS)[number];

export const REPEAT_FILTER_LABELS: Record<RepeatFilter, string> = {
  all: "All problems",
  never: "Never repeated",
  repeated: "Repeated",
};

export const DATE_RANGES = ["all", "today", "week", "month", "custom"] as const;
export type DateRangeKey = (typeof DATE_RANGES)[number];

export const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  all: "Any date",
  today: "Today",
  week: "This week",
  month: "This month",
  custom: "Custom range",
};

export const DIFFICULTY_FILTERS = ["all", ...DIFFICULTIES, "none"] as const;
export type DifficultyFilter = (typeof DIFFICULTY_FILTERS)[number];

export interface ProblemQuery {
  q: string;
  platformId: number | null;
  difficulty: DifficultyFilter;
  tagIds: number[];
  dateRange: DateRangeKey;
  from: string | null;
  to: string | null;
  repeats: RepeatFilter;
  sort: SortKey;
}

export const DEFAULT_QUERY: ProblemQuery = {
  q: "",
  platformId: null,
  difficulty: "all",
  tagIds: [],
  dateRange: "all",
  from: null,
  to: null,
  repeats: "all",
  sort: "newest",
};

type RawParams = Record<string, string | string[] | undefined>;

function single(params: RawParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parseProblemQuery(params: RawParams): ProblemQuery {
  const platformRaw = Number(single(params, "platform"));
  const dateRaw = single(params, "range");
  const from = single(params, "from");
  const to = single(params, "to");

  return {
    q: single(params, "q").trim(),
    platformId: Number.isInteger(platformRaw) && platformRaw > 0 ? platformRaw : null,
    difficulty: oneOf(single(params, "difficulty"), DIFFICULTY_FILTERS, "all"),
    tagIds: single(params, "tags")
      .split(",")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
    dateRange: oneOf(dateRaw, DATE_RANGES, "all"),
    from: from.length > 0 ? from : null,
    to: to.length > 0 ? to : null,
    repeats: oneOf(single(params, "repeats"), REPEAT_FILTERS, "all"),
    sort: oneOf(single(params, "sort"), SORT_KEYS, "newest"),
  };
}

export function serializeProblemQuery(query: ProblemQuery): string {
  const params = new URLSearchParams();
  if (query.q.length > 0) {
    params.set("q", query.q);
  }
  if (query.platformId) {
    params.set("platform", String(query.platformId));
  }
  if (query.difficulty !== "all") {
    params.set("difficulty", query.difficulty);
  }
  if (query.tagIds.length > 0) {
    params.set("tags", query.tagIds.join(","));
  }
  if (query.dateRange !== "all") {
    params.set("range", query.dateRange);
  }
  if (query.dateRange === "custom") {
    if (query.from) {
      params.set("from", query.from);
    }
    if (query.to) {
      params.set("to", query.to);
    }
  }
  if (query.repeats !== "all") {
    params.set("repeats", query.repeats);
  }
  if (query.sort !== "newest") {
    params.set("sort", query.sort);
  }
  return params.toString();
}

export function hasActiveFilters(query: ProblemQuery): boolean {
  return (
    query.q.length > 0 ||
    query.platformId !== null ||
    query.difficulty !== "all" ||
    query.tagIds.length > 0 ||
    query.dateRange !== "all" ||
    query.repeats !== "all"
  );
}

export interface DateBounds {
  from: string | null;
  to: string | null;
}

export function resolveDateBounds(query: ProblemQuery, today: string): DateBounds {
  switch (query.dateRange) {
    case "today":
      return { from: today, to: today };
    case "week":
      return { from: startOfWeek(today), to: endOfWeek(today) };
    case "month":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "custom":
      return { from: query.from, to: query.to };
    default:
      return { from: null, to: null };
  }
}

export type { Difficulty };
