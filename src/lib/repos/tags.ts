import { db } from "@/lib/db";
import type { Tag, TagWithCount } from "@/lib/types";

interface TagRow {
  id: number;
  name: string;
  created_at: string;
}

interface TagCountRow extends TagRow {
  problem_count: number;
}

function toTag(row: TagRow): Tag {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export function listTags(): Tag[] {
  return (
    db()
      .prepare("SELECT id, name, created_at FROM tag ORDER BY name COLLATE NOCASE")
      .all() as TagRow[]
  ).map(toTag);
}

export function listTagsWithCounts(): TagWithCount[] {
  const rows = db()
    .prepare(
      `SELECT t.id, t.name, t.created_at, COUNT(pt.problem_id) AS problem_count
       FROM tag t
       LEFT JOIN problem_tag pt ON pt.tag_id = t.id
       GROUP BY t.id
       ORDER BY problem_count DESC, t.name COLLATE NOCASE`,
    )
    .all() as TagCountRow[];

  return rows.map((row) => ({ ...toTag(row), problemCount: row.problem_count }));
}

export function findTagByName(name: string): Tag | null {
  const row = db()
    .prepare("SELECT id, name, created_at FROM tag WHERE name = ? COLLATE NOCASE")
    .get(name.trim()) as TagRow | undefined;
  return row ? toTag(row) : null;
}

export function createTag(name: string): Tag {
  const trimmed = name.trim();
  const existing = findTagByName(trimmed);
  if (existing) {
    return existing;
  }

  const info = db()
    .prepare("INSERT INTO tag (name, created_at) VALUES (?, datetime('now'))")
    .run(trimmed);

  return {
    id: Number(info.lastInsertRowid),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
}

export function renameTag(id: number, name: string): void {
  db().prepare("UPDATE tag SET name = ? WHERE id = ?").run(name.trim(), id);
}

export function deleteTag(id: number): void {
  db().prepare("DELETE FROM tag WHERE id = ?").run(id);
}

export function getTagsForProblem(problemId: number): Tag[] {
  return (
    db()
      .prepare(
        `SELECT t.id, t.name, t.created_at
         FROM tag t
         JOIN problem_tag pt ON pt.tag_id = t.id
         WHERE pt.problem_id = ?
         ORDER BY t.name COLLATE NOCASE`,
      )
      .all(problemId) as TagRow[]
  ).map(toTag);
}

export function setProblemTags(problemId: number, tagIds: number[]): void {
  const database = db();
  const remove = database.prepare("DELETE FROM problem_tag WHERE problem_id = ?");
  const add = database.prepare(
    "INSERT OR IGNORE INTO problem_tag (problem_id, tag_id) VALUES (?, ?)",
  );

  database.transaction(() => {
    remove.run(problemId);
    for (const tagId of new Set(tagIds)) {
      add.run(problemId, tagId);
    }
  })();
}
