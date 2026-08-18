import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspectFolder, type FolderInspection } from "./dataFolder";

export interface DirectoryEntry {
  name: string;
  path: string;
  isDataFolder: boolean;
}

export interface BrowseResult {
  path: string | null;
  parent: string | null;
  entries: DirectoryEntry[];
  drives: string[];
  inspection: FolderInspection | null;
  error: string | null;
}

export function listDrives(): string[] {
  if (process.platform !== "win32") {
    return ["/"];
  }

  const drives: string[] = [];
  for (let code = 65; code <= 90; code += 1) {
    const root = `${String.fromCharCode(code)}:${path.sep}`;
    try {
      if (fs.existsSync(root)) {
        drives.push(root);
      }
    } catch {
      continue;
    }
  }
  return drives;
}

export function defaultBrowsePath(): string {
  return os.homedir();
}

function parentOf(target: string): string | null {
  const parent = path.dirname(target);
  return parent === target ? null : parent;
}

function quickIsDataFolder(dir: string): boolean {
  try {
    return fs.existsSync(path.join(dir, "metadata.json")) &&
      fs.existsSync(path.join(dir, "database.db"));
  } catch {
    return false;
  }
}

export function browseDirectory(target?: string | null): BrowseResult {
  const drives = listDrives();
  const requested = target && target.length > 0 ? path.resolve(target) : defaultBrowsePath();

  if (!fs.existsSync(requested)) {
    return {
      path: requested,
      parent: parentOf(requested),
      entries: [],
      drives,
      inspection: { status: "missing" },
      error: "That folder does not exist.",
    };
  }

  let entries: DirectoryEntry[] = [];
  let error: string | null = null;

  try {
    entries = fs
      .readdirSync(requested, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => {
        const full = path.join(requested, entry.name);
        return { name: entry.name, path: full, isDataFolder: quickIsDataFolder(full) };
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  } catch {
    error = "This folder cannot be opened. You may not have permission to read it.";
  }

  return {
    path: requested,
    parent: parentOf(requested),
    entries,
    drives,
    inspection: inspectFolder(requested),
    error,
  };
}
