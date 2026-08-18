import { ensureDataFolderOpen } from "@/lib/fs/dataFolder";
import { getDb } from "./connection";
import type { Database } from "better-sqlite3";

export function db(): Database {
  ensureDataFolderOpen();
  return getDb();
}
