"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createFolder, useDataFolder } from "@/actions/dataFolder";
import { cn } from "@/lib/cn";

interface DirectoryEntry {
  name: string;
  path: string;
  isDataFolder: boolean;
}

type Inspection =
  | { status: "valid"; metadata: { createdAt: string } }
  | { status: "missing" }
  | { status: "empty" }
  | { status: "not-a-data-folder"; reason: string };

interface BrowseResult {
  path: string | null;
  parent: string | null;
  entries: DirectoryEntry[];
  drives: string[];
  inspection: Inspection | null;
  error: string | null;
}

export function FolderBrowser({
  initialPath,
  confirmLabel = "Use This Folder",
  mode = "apply",
  onDone,
  onSelectPath,
}: {
  initialPath?: string;
  confirmLabel?: string;
  mode?: "apply" | "select";
  onDone?: () => void;
  onSelectPath?: (path: string) => void;
}) {
  const router = useRouter();
  const [result, setResult] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async (target?: string | null) => {
    setLoading(true);
    setMessage(null);
    const query = target ? `?path=${encodeURIComponent(target)}` : "";
    const response = await fetch(`/api/browse${query}`);
    setResult((await response.json()) as BrowseResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(initialPath);
  }, [load, initialPath]);

  const currentPath = result?.path ?? "";
  const inspection = result?.inspection;

  // Applying accepts an existing data folder or an empty one. Selecting a
  // restore target only accepts an empty folder.
  const canConfirm =
    mode === "select"
      ? inspection?.status === "empty"
      : inspection?.status === "valid" || inspection?.status === "empty";

  function handleCreate() {
    if (!currentPath) {
      return;
    }
    startTransition(async () => {
      const created = await createFolder(currentPath, newName);
      if (!created.ok) {
        setMessage(created.error ?? "Could not create the folder.");
        return;
      }
      setNewName("");
      setCreating(false);
      await load(created.path);
    });
  }

  function handleConfirm() {
    if (!currentPath) {
      return;
    }

    if (mode === "select") {
      onSelectPath?.(currentPath);
      setMessage(null);
      return;
    }

    startTransition(async () => {
      const applied = await useDataFolder(currentPath);
      if (!applied.ok) {
        setMessage(applied.error ?? "Could not use that folder.");
        return;
      }
      onDone?.();
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {result?.drives.map((drive) => (
          <Button
            key={drive}
            size="sm"
            variant={currentPath.startsWith(drive) ? "primary" : "secondary"}
            onClick={() => void load(drive)}
          >
            {drive}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => void load(result?.parent)}
          disabled={!result?.parent || loading}
        >
          Up one level
        </Button>
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-sunken px-3 py-2 font-mono text-xs text-content-muted">
          {currentPath || "Loading"}
        </code>
      </div>

      <div className="h-64 overflow-y-auto rounded-lg border border-border bg-surface-raised">
        {loading ? (
          <p className="p-4 text-sm text-content-muted">Loading folders</p>
        ) : result?.error ? (
          <p className="p-4 text-sm text-danger">{result.error}</p>
        ) : result?.entries.length === 0 ? (
          <p className="p-4 text-sm text-content-muted">This folder has no subfolders.</p>
        ) : (
          <ul className="divide-y divide-border">
            {result?.entries.map((entry) => (
              <li key={entry.path}>
                <button
                  type="button"
                  onClick={() => void load(entry.path)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-content transition-colors hover:bg-surface-sunken"
                >
                  <span className="truncate">{entry.name}</span>
                  {entry.isDataFolder ? (
                    <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      LeetTrack data
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {inspection ? (
        <p
          className={cn(
            "text-sm",
            inspection.status === "valid" && (mode === "select" ? "text-danger" : "text-easy"),
            inspection.status === "empty" && "text-content-muted",
            inspection.status === "not-a-data-folder" && "text-danger",
          )}
        >
          {inspection.status === "valid" &&
            (mode === "select"
              ? "This folder already holds LeetTrack data. Pick an empty folder instead."
              : "This is a LeetTrack data folder. Your existing data will be loaded.")}
          {inspection.status === "empty" &&
            (mode === "select"
              ? "This folder is empty and can receive the backup."
              : "This folder is empty. A new LeetTrack data folder will be set up here.")}
          {inspection.status === "not-a-data-folder" && inspection.reason}
          {inspection.status === "missing" && "This folder does not exist."}
        </p>
      ) : null}

      {creating ? (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              autoFocus
              value={newName}
              placeholder="LeetTrackData"
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
          <Button variant="primary" onClick={handleCreate} disabled={pending}>
            Create
          </Button>
          <Button onClick={() => setCreating(false)} disabled={pending}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm || pending}>
            {pending ? "Working" : mode === "select" ? "Select This Folder" : confirmLabel}
          </Button>
          <Button onClick={() => setCreating(true)} disabled={!currentPath || pending}>
            Create New Folder Here
          </Button>
        </div>
      )}

      {message ? <p className="text-sm text-danger">{message}</p> : null}
    </div>
  );
}
