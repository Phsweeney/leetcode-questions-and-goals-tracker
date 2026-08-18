import fs from "node:fs";
import path from "node:path";
import { unzipSync, zipSync, type Unzipped, type Zippable } from "fflate";
import { APP_NAME } from "@/lib/config";
import {
  ATTACHMENTS_DIR,
  DATABASE_FILE,
  EXPORTS_DIR,
  METADATA_FILE,
  inspectFolder,
  scaffoldDataFolder,
} from "./dataFolder";

// Previous backups living in exports/ are left out so a backup never nests
// older backups inside itself.
const EXCLUDED_DIRS = new Set([EXPORTS_DIR]);

function collectFiles(root: string, relative = ""): Zippable {
  const entries: Zippable = {};
  const absolute = path.join(root, relative);

  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const childRelative = relative.length > 0 ? `${relative}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (relative.length === 0 && EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      Object.assign(entries, collectFiles(root, childRelative));
      continue;
    }

    if (entry.isFile()) {
      entries[childRelative] = new Uint8Array(fs.readFileSync(path.join(root, childRelative)));
    }
  }

  return entries;
}

export function backupFileName(today: string): string {
  return `LeetTrack-Backup-${today}.zip`;
}

export function createBackup(dataDir: string): Uint8Array {
  const inspection = inspectFolder(dataDir);
  if (inspection.status !== "valid") {
    throw new Error("The current data folder cannot be backed up.");
  }

  const files = collectFiles(path.resolve(dataDir));
  if (!files[DATABASE_FILE]) {
    throw new Error("The data folder has no database file to back up.");
  }

  return zipSync(files, { level: 6 });
}

export interface RestoreOutcome {
  ok: boolean;
  error?: string;
}

function isLeetTrackArchive(entries: Unzipped): boolean {
  const metadata = entries[METADATA_FILE];
  if (!metadata || !entries[DATABASE_FILE]) {
    return false;
  }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(metadata)) as { app?: string };
    return parsed.app === APP_NAME;
  } catch {
    return false;
  }
}

export function restoreBackup(archive: Uint8Array, targetDir: string): RestoreOutcome {
  const resolved = path.resolve(targetDir);

  const inspection = inspectFolder(resolved);
  if (inspection.status === "valid" || inspection.status === "not-a-data-folder") {
    return {
      ok: false,
      error: "Choose an empty folder or a new folder so an import cannot overwrite data.",
    };
  }

  let entries: Unzipped;
  try {
    entries = unzipSync(archive);
  } catch {
    return { ok: false, error: "That file is not a readable zip archive." };
  }

  if (!isLeetTrackArchive(entries)) {
    return { ok: false, error: "That archive does not contain a LeetTrack backup." };
  }

  scaffoldDataFolder(resolved);

  for (const [name, contents] of Object.entries(entries)) {
    if (name.endsWith("/")) {
      continue;
    }
    // Reject any archive entry that tries to escape the target folder.
    const destination = path.resolve(resolved, name);
    if (destination !== resolved && !destination.startsWith(resolved + path.sep)) {
      return { ok: false, error: "That archive contains an unsafe file path." };
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents);
  }

  fs.mkdirSync(path.join(resolved, ATTACHMENTS_DIR), { recursive: true });
  fs.mkdirSync(path.join(resolved, EXPORTS_DIR), { recursive: true });

  return { ok: true };
}
