"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { addTag, editTag, removeTag } from "@/actions/tags";
import type { TagWithCount } from "@/lib/types";

type Dialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "rename"; tag: TagWithCount }
  | { kind: "delete"; tag: TagWithCount };

export function TagManager({ tags }: { tags: TagWithCount[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setDialog({ kind: "none" });
    setValue("");
    setError(null);
  }

  function submit() {
    startTransition(async () => {
      let result;
      if (dialog.kind === "create") {
        result = await addTag(value);
      } else if (dialog.kind === "rename") {
        result = await editTag(dialog.tag.id, value);
      } else if (dialog.kind === "delete") {
        result = await removeTag(dialog.tag.id);
      } else {
        return;
      }

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setDialog({ kind: "create" })}>
          + Create Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <EmptyState
          title="No tags yet"
          description="Tags let you group problems by technique or topic. Create one here, or add tags directly while saving a problem."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-raised">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between gap-4 px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-content">{tag.name}</p>
                <p className="text-xs text-content-muted">
                  {tag.problemCount} {tag.problemCount === 1 ? "problem" : "problems"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setValue(tag.name);
                    setDialog({ kind: "rename", tag });
                  }}
                >
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDialog({ kind: "delete", tag })}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={dialog.kind === "create" || dialog.kind === "rename"}
        title={dialog.kind === "rename" ? "Rename tag" : "Create tag"}
        onClose={close}
        footer={
          <>
            <Button onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={pending}>
              {pending ? "Saving" : "Save"}
            </Button>
          </>
        }
      >
        <Field label="Tag name" htmlFor="tag-name">
          <Input
            id="tag-name"
            autoFocus
            value={value}
            placeholder="Binary Search"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
          />
        </Field>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Modal>

      <Modal
        open={dialog.kind === "delete"}
        title="Delete tag"
        description={
          dialog.kind === "delete"
            ? `"${dialog.tag.name}" will be removed from ${dialog.tag.problemCount} ${
                dialog.tag.problemCount === 1 ? "problem" : "problems"
              }. The problems themselves are kept.`
            : undefined
        }
        onClose={close}
        footer={
          <>
            <Button onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submit} disabled={pending}>
              {pending ? "Deleting" : "Delete tag"}
            </Button>
          </>
        }
      />
    </>
  );
}
