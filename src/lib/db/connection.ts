import BetterSqlite3, { type Database } from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { getSchemaVersion, hasPendingMigrations, runMigrations } from "./migrate";

let connection: Database | null = null;
let connectionPath: string | null = null;

function configure(db: Database): void {
  // DELETE journalling keeps the data folder to a single database file so it
  // stays safe to copy between machines
  db.pragma("journal_mode = DELETE");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
}

function backupBeforeMigration(dbPath: string, backupDir: string, version: number): void {
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupDir, `pre-migration-v${version}-${stamp}.db`);
  fs.copyFileSync(dbPath, target);
}

export interface OpenDatabaseOptions {
  backupDir?: string;
}

export function openDatabase(dbPath: string, options: OpenDatabaseOptions = {}): Database {
  closeDatabase();

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new BetterSqlite3(dbPath);
  configure(db);

  const existingVersion = getSchemaVersion(db);
  if (options.backupDir && existingVersion > 0 && hasPendingMigrations(db)) {
    backupBeforeMigration(dbPath, options.backupDir, existingVersion);
  }

  try {
    runMigrations(db);
  } catch (error) {
    db.close();
    throw error;
  }

  connection = db;
  connectionPath = dbPath;
  return db;
}

export function getDb(): Database {
  if (!connection) {
    throw new Error("No data folder is open. Complete setup before using the database.");
  }
  return connection;
}

export function isDatabaseOpen(): boolean {
  return connection !== null;
}

export function getOpenDatabasePath(): string | null {
  return connectionPath;
}

export function closeDatabase(): void {
  if (connection) {
    connection.close();
    connection = null;
    connectionPath = null;
  }
}
