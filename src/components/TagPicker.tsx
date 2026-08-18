"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { addTag } from "@/actions/tags";
import type { Tag } from "@/lib/types";

export function TagPicker({
  name,
  tags,
  defaultSelectedIds = [],
}: {
  name: string;
  tags: Tag[];
  defaultSelectedIds?: number[];
}) {
  const [options, setOptions] = useState(tags);
  const [selectedIds, setSelectedIds] = useState<number[]>(defaultSelectedIds);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => selectedIds.map((id) => options.find((tag) => tag.id === id)).filter(Boolean) as Tag[],
    [selectedIds, options],
  );

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return options
      .filter((tag) => !selectedIds.includes(tag.id))
      .filter((tag) => term.length === 0 || tag.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [options, selectedIds, query]);

  const exactMatch = options.some(
    (tag) => tag.name.toLowerCase() === query.trim().toLowerCase(),
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  function select(id: number) {
    setSelectedIds((current) => (current.includes(id) ? current : [...current, id]));
    setQuery("");
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await addTag(query);
      if (!result.ok || !result.tag) {
        setError(result.error ?? "Could not create the tag.");
        return;
      }
      const tag = result.tag;
      setOptions((current) => [...current, tag]);
      setSelectedIds((current) => [...current, tag.id]);
      setQuery("");
      setError(null);
    });
  }

  return (
    <div className="space-y-2">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                setSelectedIds((current) => current.filter((id) => id !== tag.id))
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent transition-opacity hover:opacity-70"
            >
              {tag.name}
              <span aria-hidden="true">x</span>
              <span className="sr-only">Remove tag</span>
            </button>
          ))}
        </div>
      ) : null}

      <Input
        value={query}
        placeholder="Search tags, or type a new name"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }
          event.preventDefault();
          if (suggestions.length > 0) {
            select(suggestions[0].id);
          } else if (canCreate) {
            handleCreate();
          }
        }}
      />

      {suggestions.length > 0 || canCreate ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => select(tag.id)}
              className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-content-muted transition-colors hover:border-accent hover:text-accent"
            >
              {tag.name}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending}
              className="rounded-full border border-dashed border-accent px-2.5 py-0.5 text-xs font-medium text-accent transition-opacity hover:opacity-70 disabled:opacity-50"
            >
              + Create {query.trim()}
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
