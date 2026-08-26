export interface Migration {
  version: number;
  name: string;
  sql: string;
}

const init = `
CREATE TABLE platform (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL
);

CREATE TABLE problem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT,
  platform_id INTEGER NOT NULL REFERENCES platform(id) ON DELETE RESTRICT,
  difficulty TEXT CHECK (difficulty IS NULL OR difficulty IN ('Easy', 'Medium', 'Hard')),
  completed_date TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL
);

CREATE TABLE problem_tag (
  problem_id INTEGER NOT NULL REFERENCES problem(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, tag_id)
);

CREATE TABLE repeat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL REFERENCES problem(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  result TEXT CHECK (result IS NULL OR result IN ('easy', 'struggled', 'failed')),
  duration_minutes INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE goal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_count INTEGER NOT NULL CHECK (target_count > 0),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_problem_completed_date ON problem(completed_date);
CREATE INDEX idx_problem_platform ON problem(platform_id);
CREATE INDEX idx_repeat_problem ON repeat(problem_id);
CREATE INDEX idx_repeat_date ON repeat(date);
CREATE INDEX idx_problem_tag_tag ON problem_tag(tag_id);

INSERT INTO platform (name, created_at) VALUES
  ('LeetCode', datetime('now')),
  ('Codeforces', datetime('now')),
  ('HackerRank', datetime('now')),
  ('NeetCode', datetime('now')),
  ('Other', datetime('now'));
`;

const progress = `
CREATE TABLE achievement (
  key         TEXT PRIMARY KEY,
  unlocked_at TEXT NOT NULL,
  seen_at     TEXT
);

-- Single-row scratchpad describing the most recent rewardable action, written by
-- a mutation and consumed once by the celebration overlay.
CREATE TABLE celebration (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  created_at    TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('problem','repeat')),
  title         TEXT NOT NULL,
  xp_gained     INTEGER NOT NULL,
  xp_total      INTEGER NOT NULL,
  level_before  INTEGER NOT NULL,
  level_after   INTEGER NOT NULL,
  streak        INTEGER NOT NULL,
  unlocked_keys TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_achievement_unseen ON achievement(seen_at);
`;

export const MIGRATIONS: Migration[] = [
  { version: 1, name: "init", sql: init },
  { version: 2, name: "progress", sql: progress },
];

export const SCHEMA_VERSION = MIGRATIONS.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  0,
);
