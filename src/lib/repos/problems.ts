import { db } from "@/lib/db";
import { getTagsForProblem, setProblemTags } from "./tags";
import type { ProblemInput } from "@/lib/schemas";
import { resolveDateBounds, type ProblemQuery } from "@/lib/problemQuery";
import { todayLocal } from "@/lib/dates";
import type { Difficulty, Problem, ProblemDetail, ProblemListItem, Repeat, Tag } from "@/lib/types";

export interface ProblemRow {
  id: number;
  title: string;
  url: string | null;
  platform_id: number;
  platform_name: string;
  difficulty: Difficulty | null;
  completed_date: string;
  summary: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function toProblem(row: ProblemRow): Problem {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    platformId: row.platform_id,
    platformName: row.platform_name,
    difficulty: row.difficulty,
    completedDate: row.completed_date,
    summary: row.summary,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const PROBLEM_SELECT = `
  SELECT p.id, p.title, p.url, p.platform_id, pl.name AS platform_name, p.difficulty,
         p.completed_date, p.summary, p.notes, p.created_at, p.updated_at
  FROM problem p
  JOIN platform pl ON pl.id = p.platform_id
`;

export function getProblem(id: number): Problem | null {
  const row = db()
    .prepare(`${PROBLEM_SELECT} WHERE p.id = ?`)
    .get(id) as ProblemRow | undefined;
  return row ? toProblem(row) : null;
}

interface RepeatRow {
  id: number;
  problem_id: number;
  date: string;
  notes: string;
  result: Repeat["result"];
  duration_minutes: number | null;
  created_at: string;
}

export function toRepeat(row: RepeatRow): Repeat {
  return {
    id: row.id,
    problemId: row.problem_id,
    date: row.date,
    notes: row.notes,
    result: row.result,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
  };
}

export function getProblemDetail(id: number): ProblemDetail | null {
  const problem = getProblem(id);
  if (!problem) {
    return null;
  }

  const repeats = (
    db()
      .prepare(
        `SELECT id, problem_id, date, notes, result, duration_minutes, created_at
         FROM repeat WHERE problem_id = ? ORDER BY date ASC, id ASC`,
      )
      .all(id) as RepeatRow[]
  ).map(toRepeat);

  return { ...problem, tags: getTagsForProblem(id), repeats };
}

export function createProblem(input: ProblemInput): number {
  const database = db();

  return database.transaction(() => {
    const info = database
      .prepare(
        `INSERT INTO problem (title, url, platform_id, difficulty, completed_date, summary, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      )
      .run(
        input.title,
        input.url.length > 0 ? input.url : null,
        input.platformId,
        input.difficulty,
        input.completedDate,
        input.summary,
        input.notes,
      );

    const id = Number(info.lastInsertRowid);
    setProblemTags(id, input.tagIds);
    return id;
  })();
}

export function updateProblem(id: number, input: ProblemInput): void {
  const database = db();

  database.transaction(() => {
    database
      .prepare(
        `UPDATE problem
         SET title = ?, url = ?, platform_id = ?, difficulty = ?, completed_date = ?,
             summary = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        input.title,
        input.url.length > 0 ? input.url : null,
        input.platformId,
        input.difficulty,
        input.completedDate,
        input.summary,
        input.notes,
        id,
      );

    setProblemTags(id, input.tagIds);
  })();
}

export function deleteProblem(id: number): void {
  db().prepare("DELETE FROM problem WHERE id = ?").run(id);
}

const SORT_CLAUSES: Record<ProblemQuery["sort"], string> = {
  newest: "p.completed_date DESC, p.id DESC",
  oldest: "p.completed_date ASC, p.id ASC",
  "title-asc": "p.title COLLATE NOCASE ASC",
  "title-desc": "p.title COLLATE NOCASE DESC",
  difficulty:
    "CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 ELSE 4 END, p.completed_date DESC",
  repeats: "repeat_count DESC, p.completed_date DESC",
  platform: "pl.name COLLATE NOCASE ASC, p.completed_date DESC",
};

interface ProblemListRow extends ProblemRow {
  repeat_count: number;
}

export function listProblems(query: ProblemQuery): ProblemListItem[] {
  const where: string[] = [];
  const params: Record<string, string | number> = {};

  if (query.q.length > 0) {
    params.term = query.q;
    where.push(`(
      instr(lower(p.title), lower(:term)) > 0
      OR instr(lower(pl.name), lower(:term)) > 0
      OR instr(lower(p.summary), lower(:term)) > 0
      OR instr(lower(p.notes), lower(:term)) > 0
      OR EXISTS (
        SELECT 1 FROM problem_tag pt
        JOIN tag t ON t.id = pt.tag_id
        WHERE pt.problem_id = p.id AND instr(lower(t.name), lower(:term)) > 0
      )
    )`);
  }

  if (query.platformId) {
    params.platformId = query.platformId;
    where.push("p.platform_id = :platformId");
  }

  if (query.difficulty === "none") {
    where.push("p.difficulty IS NULL");
  } else if (query.difficulty !== "all") {
    params.difficulty = query.difficulty;
    where.push("p.difficulty = :difficulty");
  }

  query.tagIds.forEach((tagId, index) => {
    const key = `tag${index}`;
    params[key] = tagId;
    where.push(
      `EXISTS (SELECT 1 FROM problem_tag pt WHERE pt.problem_id = p.id AND pt.tag_id = :${key})`,
    );
  });

  const bounds = resolveDateBounds(query, todayLocal());
  if (bounds.from) {
    params.fromDate = bounds.from;
    where.push("p.completed_date >= :fromDate");
  }
  if (bounds.to) {
    params.toDate = bounds.to;
    where.push("p.completed_date <= :toDate");
  }

  if (query.repeats === "never") {
    where.push("repeat_count = 0");
  } else if (query.repeats === "repeated") {
    where.push("repeat_count > 0");
  }

  const sql = `
    SELECT p.id, p.title, p.url, p.platform_id, pl.name AS platform_name, p.difficulty,
           p.completed_date, p.summary, p.notes, p.created_at, p.updated_at,
           (SELECT COUNT(*) FROM repeat r WHERE r.problem_id = p.id) AS repeat_count
    FROM problem p
    JOIN platform pl ON pl.id = p.platform_id
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${SORT_CLAUSES[query.sort]}
  `;

  const rows = db().prepare(sql).all(params) as ProblemListRow[];
  if (rows.length === 0) {
    return [];
  }

  const tagsByProblem = getTagsForProblems(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...toProblem(row),
    repeatCount: row.repeat_count,
    tags: tagsByProblem.get(row.id) ?? [],
  }));
}

function getTagsForProblems(problemIds: number[]): Map<number, Tag[]> {
  const placeholders = problemIds.map(() => "?").join(", ");
  const rows = db()
    .prepare(
      `SELECT pt.problem_id, t.id, t.name, t.created_at
       FROM problem_tag pt
       JOIN tag t ON t.id = pt.tag_id
       WHERE pt.problem_id IN (${placeholders})
       ORDER BY t.name COLLATE NOCASE`,
    )
    .all(...problemIds) as Array<{
    problem_id: number;
    id: number;
    name: string;
    created_at: string;
  }>;

  const grouped = new Map<number, Tag[]>();
  for (const row of rows) {
    const list = grouped.get(row.problem_id) ?? [];
    list.push({ id: row.id, name: row.name, createdAt: row.created_at });
    grouped.set(row.problem_id, list);
  }
  return grouped;
}

export function countProblems(): number {
  const row = db().prepare("SELECT COUNT(*) AS count FROM problem").get() as {
    count: number;
  };
  return row.count;
}
