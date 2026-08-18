import type { Database } from "better-sqlite3";
import { MIGRATIONS, SCHEMA_VERSION } from "./migrations";

export class SchemaTooNewError extends Error {
  constructor(
    readonly foundVersion: number,
    readonly supportedVersion: number,
  ) {
    super(
      `This data folder was created by a newer version of LeetTrack (schema ${foundVersion}, this app supports ${supportedVersion}). Update the application before opening it.`,
    );
    this.name = "SchemaTooNewError";
  }
}

export function getSchemaVersion(db: Database): number {
  return db.pragma("user_version", { simple: true }) as number;
}

export function hasPendingMigrations(db: Database): boolean {
  return getSchemaVersion(db) < SCHEMA_VERSION;
}

export function runMigrations(db: Database): number {
  const current = getSchemaVersion(db);

  if (current > SCHEMA_VERSION) {
    throw new SchemaTooNewError(current, SCHEMA_VERSION);
  }

  const pending = MIGRATIONS.filter(
    (migration) => migration.version > current,
  ).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    // pragma cannot run inside a transaction, so version is stamped after commit
    db.transaction(() => {
      db.exec(migration.sql);
    })();
    db.pragma(`user_version = ${migration.version}`);
  }

  return getSchemaVersion(db);
}
