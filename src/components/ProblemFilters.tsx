"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  DATE_RANGES,
  DATE_RANGE_LABELS,
  DEFAULT_QUERY,
  DIFFICULTY_FILTERS,
  REPEAT_FILTERS,
  REPEAT_FILTER_LABELS,
  SORT_KEYS,
  SORT_LABELS,
  hasActiveFilters,
  serializeProblemQuery,
  type ProblemQuery,
} from "@/lib/problemQuery";
import type { Platform, Tag } from "@/lib/types";
import { cn } from "@/lib/cn";

export function ProblemFilters({
  query,
  platforms,
  tags,
  resultCount,
}: {
  query: ProblemQuery;
  platforms: Platform[];
  tags: Tag[];
  resultCount: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(query);
  const [searchTerm, setSearchTerm] = useState(query.q);

  useEffect(() => {
    setDraft(query);
    setSearchTerm(query.q);
  }, [query]);

  const target = useMemo(() => serializeProblemQuery(draft), [draft]);

  useEffect(() => {
    const current = serializeProblemQuery(query);
    if (target === current) {
      return;
    }
    router.replace(target.length > 0 ? `/problems?${target}` : "/problems");
  }, [target, query, router]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDraft((current) => ({ ...current, q: searchTerm.trim() }));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  function update(patch: Partial<ProblemQuery>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleTag(id: number) {
    setDraft((current) => ({
      ...current,
      tagIds: current.tagIds.includes(id)
        ? current.tagIds.filter((tagId) => tagId !== id)
        : [...current.tagIds, id],
    }));
  }

  const active = hasActiveFilters(draft);

  return (
    <div className="space-y-4">
      <Input
        value={searchTerm}
        placeholder="Search problems by title, platform, tag, summary, or notes"
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          aria-label="Platform"
          value={draft.platformId ?? ""}
          onChange={(event) => update({ platformId: Number(event.target.value) || null })}
        >
          <option value="">All platforms</option>
          {platforms.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Difficulty"
          value={draft.difficulty}
          onChange={(event) =>
            update({ difficulty: event.target.value as ProblemQuery["difficulty"] })
          }
        >
          {DIFFICULTY_FILTERS.map((value) => (
            <option key={value} value={value}>
              {value === "all"
                ? "All difficulties"
                : value === "none"
                  ? "No difficulty"
                  : value}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Completion date"
          value={draft.dateRange}
          onChange={(event) =>
            update({ dateRange: event.target.value as ProblemQuery["dateRange"] })
          }
        >
          {DATE_RANGES.map((value) => (
            <option key={value} value={value}>
              {DATE_RANGE_LABELS[value]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Repetition"
          value={draft.repeats}
          onChange={(event) =>
            update({ repeats: event.target.value as ProblemQuery["repeats"] })
          }
        >
          {REPEAT_FILTERS.map((value) => (
            <option key={value} value={value}>
              {REPEAT_FILTER_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      {draft.dateRange === "custom" ? (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-content-muted" htmlFor="from">
            From
          </label>
          <Input
            id="from"
            type="date"
            className="w-auto"
            value={draft.from ?? ""}
            onChange={(event) => update({ from: event.target.value || null })}
          />
          <label className="text-sm text-content-muted" htmlFor="to">
            To
          </label>
          <Input
            id="to"
            type="date"
            className="w-auto"
            value={draft.to ?? ""}
            onChange={(event) => update({ to: event.target.value || null })}
          />
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs text-content-subtle">
            Tags, showing problems that carry every tag you pick
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const selected = draft.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-transparent bg-accent-soft text-accent"
                      : "border-border bg-surface text-content-muted hover:border-border-strong hover:text-content",
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-content-muted">
          {resultCount} {resultCount === 1 ? "problem" : "problems"}
        </p>
        <div className="flex items-center gap-2">
          {active ? (
            <Button size="sm" variant="ghost" onClick={() => setDraft(DEFAULT_QUERY)}>
              Clear filters
            </Button>
          ) : null}
          <label className="text-sm text-content-muted" htmlFor="sort">
            Sort
          </label>
          <Select
            id="sort"
            className="h-8 w-auto text-xs"
            value={draft.sort}
            onChange={(event) => update({ sort: event.target.value as ProblemQuery["sort"] })}
          >
            {SORT_KEYS.map((value) => (
              <option key={value} value={value}>
                {SORT_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
