import fs from "node:fs";
import path from "node:path";
import { APP_NAME, getConfiguredDataDir } from "@/lib/config";
import {
  closeDatabase,
  getOpenDatabasePath,
  isDatabaseOpen,
  openDatabase,
} from "@/lib/db/connection";
import { SCHEMA_VERSION } from "@/lib/db/migrations";

export const DATABASE_FILE = "database.db";
export const METADATA_FILE = "metadata.json";
export const ATTACHMENTS_DIR = "attachments";
export const EXPORTS_DIR = "exports";

export const APP_DATA_VERSION = 1;

export interface DataFolderMetadata {
  app: string;
  schemaVersion: number;
  appDataVersion: number;
  createdAt: string;
}

export type FolderInspection =
  | { status: "valid"; metadata: DataFolderMetadata }
  | { status: "missing" }
  | { status: "empty" }
  | { status: "not-a-data-folder"; reason: string };

export function databasePath(dataDir: string): string {
  return path.join(dataDir, DATABASE_FILE);
}

export function metadataPath(dataDir: string): string {
  return path.join(dataDir, METADATA_FILE);
}

export function exportsPath(dataDir: string): string {
  return path.join(dataDir, EXPORTS_DIR);
}

export function attachmentsPath(dataDir: string): string {
  return path.join(dataDir, ATTACHMENTS_DIR);
}

export function readMetadata(dataDir: string): DataFolderMetadata | null {
  const file = metadataPath(dataDir);
  if (!fs.existsSync(file)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<DataFolderMetadata>;
    if (parsed.app !== APP_NAME) {
      return null;
    }
    return {
      app: parsed.app,
      schemaVersion: Number(parsed.schemaVersion ?? 0),
      appDataVersion: Number(parsed.appDataVersion ?? 0),
      createdAt: String(parsed.createdAt ?? ""),
    };
  } catch {
    return null;
  }
}

export function writeMetadata(dataDir: string, metadata: DataFolderMetadata): void {
  fs.writeFileSync(metadataPath(dataDir), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

export function inspectFolder(dataDir: string): FolderInspection {
  if (!fs.existsSync(dataDir)) {
    return { status: "missing" };
  }
  if (!fs.statSync(dataDir).isDirectory()) {
    return { status: "not-a-data-folder", reason: "That path is a file, not a folder." };
  }

  const entries = fs.readdirSync(dataDir);
  if (entries.length === 0) {
    return { status: "empty" };
  }

  const metadata = readMetadata(dataDir);
  if (!metadata) {
    return {
      status: "not-a-data-folder",
      reason: "This folder is not empty and does not contain LeetTrack data.",
    };
  }
  if (!fs.existsSync(databasePath(dataDir))) {
    return {
      status: "not-a-data-folder",
      reason: "This folder has LeetTrack metadata but its database file is missing.",
    };
  }
  return { status: "valid", metadata };
}

export function scaffoldDataFolder(dataDir: string): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(attachmentsPath(dataDir), { recursive: true });
  fs.mkdirSync(exportsPath(dataDir), { recursive: true });
}

export function syncMetadata(dataDir: string): DataFolderMetadata {
  const existing = readMetadata(dataDir);
  const metadata: DataFolderMetadata = {
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    appDataVersion: APP_DATA_VERSION,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  writeMetadata(dataDir, metadata);
  return metadata;
}

export function openDataFolder(dataDir: string): void {
  const resolved = path.resolve(dataDir);
  scaffoldDataFolder(resolved);
  openDatabase(databasePath(resolved), { backupDir: exportsPath(resolved) });
  syncMetadata(resolved);
}

export function ensureDataFolderOpen(): string {
  const dataDir = getConfiguredDataDir();
  if (!dataDir) {
    throw new Error("No data folder is configured.");
  }

  const expected = databasePath(path.resolve(dataDir));
  if (isDatabaseOpen() && getOpenDatabasePath() === expected) {
    return path.resolve(dataDir);
  }

  openDataFolder(dataDir);
  return path.resolve(dataDir);
}

export function closeDataFolder(): void {
  closeDatabase();
}

export interface DataFolderStatus {
  dataDir: string | null;
  inspection: FolderInspection | null;
  isReady: boolean;
}

export function getDataFolderStatus(): DataFolderStatus {
  const dataDir = getConfiguredDataDir();
  if (!dataDir) {
    return { dataDir: null, inspection: null, isReady: false };
  }
  const inspection = inspectFolder(dataDir);
  return { dataDir, inspection, isReady: inspection.status === "valid" };
}
