"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FolderBrowser } from "@/components/FolderBrowser";

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-raised p-5">
      <h2 className="text-sm font-medium text-content">{title}</h2>
      <p className="mt-1 text-sm text-content-muted">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DataFolderSettings({
  dataDir,
  lockedByEnv,
  schemaVersion,
  createdAt,
}: {
  dataDir: string;
  lockedByEnv: boolean;
  schemaVersion: number;
  createdAt: string;
}) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importTarget, setImportTarget] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handleImport() {
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Choose a backup zip file first.");
      return;
    }
    if (!importTarget) {
      setError("Choose an empty folder to restore into.");
      return;
    }

    startTransition(async () => {
      const body = new FormData();
      body.set("archive", file);
      body.set("targetPath", importTarget);

      const response = await fetch("/api/import", { method: "POST", body });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!result.ok) {
        setError(result.error ?? "Could not import that backup.");
        return;
      }

      setError(null);
      setMessage("Backup restored. LeetTrack is now using the restored folder.");
      setImporting(false);
      setImportTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <Card
        title="Data folder"
        description="Everything you track lives here. Close LeetTrack, copy this folder to another computer, and select it there to pick up where you left off."
      >
        <code className="block overflow-x-auto rounded-lg border border-border bg-surface-sunken px-3 py-2 font-mono text-xs text-content-muted">
          {dataDir}
        </code>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-content-subtle">
          <div className="flex gap-1.5">
            <dt>Schema version</dt>
            <dd className="text-content-muted">{schemaVersion}</dd>
          </div>
          {createdAt ? (
            <div className="flex gap-1.5">
              <dt>Created</dt>
              <dd className="text-content-muted">{createdAt.slice(0, 10)}</dd>
            </div>
          ) : null}
        </dl>

        {lockedByEnv ? (
          <p className="mt-4 rounded-lg border border-border bg-surface-sunken px-3 py-2 text-xs text-content-muted">
            This location is fixed by the LEETTRACK_DATA_DIR environment variable. Clear that
            variable to change folders from here.
          </p>
        ) : (
          <div className="mt-4">
            <Button onClick={() => setChanging(true)}>Change Data Folder</Button>
          </div>
        )}
      </Card>

      <Card
        title="Backup"
        description="An export is a zip of your database, metadata, and attachments. Keep one somewhere safe in case the database is ever damaged."
      >
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface-raised px-4 text-sm font-medium text-content transition-colors hover:border-border-strong hover:bg-surface-sunken"
          >
            Export Backup
          </a>
          {!lockedByEnv ? (
            <Button onClick={() => setImporting(true)}>Import Backup</Button>
          ) : null}
        </div>
        {message ? <p className="mt-3 text-sm text-easy">{message}</p> : null}
      </Card>

      <Modal
        open={changing}
        title="Change data folder"
        description="Pick an existing LeetTrack data folder to load it, or an empty folder to start a fresh one."
        onClose={() => setChanging(false)}
        width="max-w-2xl"
      >
        <FolderBrowser initialPath={dataDir} onDone={() => setChanging(false)} />
      </Modal>

      <Modal
        open={importing}
        title="Import backup"
        description="Restoring writes into an empty folder, so your current data is never overwritten."
        onClose={() => {
          setImporting(false);
          setError(null);
        }}
        width="max-w-2xl"
        footer={
          <>
            <Button onClick={() => setImporting(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImport} disabled={pending}>
              {pending ? "Restoring" : "Restore backup"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="archive" className="block text-sm font-medium text-content">
              Backup file
            </label>
            <input
              id="archive"
              ref={fileInput}
              type="file"
              accept=".zip,application/zip"
              className="block w-full text-sm text-content-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-content hover:file:bg-surface-sunken"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-content">Restore into</p>
            <p className="text-xs text-content-muted">
              Navigate to an empty folder, or create a new one, then select it below.
            </p>
            <FolderPicker onSelect={setImportTarget} selected={importTarget} />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </Modal>
    </div>
  );
}

function FolderPicker({
  onSelect,
  selected,
}: {
  onSelect: (path: string) => void;
  selected: string | null;
}) {
  return (
    <div className="space-y-2">
      <FolderBrowser mode="select" onSelectPath={onSelect} />
      {selected ? (
        <p className="text-xs text-content-muted">
          Selected: <span className="font-mono">{selected}</span>
        </p>
      ) : null}
    </div>
  );
}
