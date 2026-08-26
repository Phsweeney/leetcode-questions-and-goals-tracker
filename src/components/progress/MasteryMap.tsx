import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DEFAULT_QUERY, serializeProblemQuery } from "@/lib/problemQuery";
import { cn } from "@/lib/cn";
import type { TagMastery } from "@/lib/progress/mastery";

const MIX = [
  { key: "easy", label: "Easy", fill: "bg-easy" },
  { key: "medium", label: "Medium", fill: "bg-medium" },
  { key: "hard", label: "Hard", fill: "bg-hard" },
  { key: "unset", label: "Unset", fill: "bg-border-strong" },
] as const;

function tagHref(tagId: number): string {
  return `/problems?${serializeProblemQuery({ ...DEFAULT_QUERY, tagIds: [tagId] })}`;
}

export function MasteryMap({ tags }: { tags: TagMastery[] }) {
  const started = tags.filter((tag) => tag.solved > 0);
  const untouched = tags.filter((tag) => tag.solved === 0);

  if (started.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-content">Topic mastery</h2>
        <p className="text-xs text-content-subtle">
          Harder problems and revisits count for more
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {started.map((tag, index) => (
          <MasteryTile key={tag.id} tag={tag} index={index} />
        ))}
      </div>

      {untouched.length > 0 ? (
        <p className="text-xs text-content-subtle">
          Not started yet: {untouched.map((tag) => tag.name).join(", ")}
        </p>
      ) : null}
    </section>
  );
}

function MasteryTile({ tag, index }: { tag: TagMastery; index: number }) {
  const segments = MIX.map((entry) => ({ ...entry, count: tag[entry.key] })).filter(
    (entry) => entry.count > 0,
  );

  return (
    <Link
      href={tagHref(tag.id)}
      style={{ animationDelay: `${Math.min(index * 24, 400)}ms` }}
      className="lt-anim-pop block rounded-xl border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-content">{tag.name}</p>
        <Badge tone={tag.tierIndex >= 3 ? "accent" : "neutral"}>{tag.tier}</Badge>
      </div>

      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-content">
        {tag.solved}
        <span className="ml-1.5 text-xs font-normal text-content-muted">
          solved
          {tag.repeats > 0 ? ` · ${tag.repeats} revisited` : ""}
        </span>
      </p>

      {/* Difficulty mix. Counts are in the tooltip because these three fills are
          not far enough apart in light mode to carry the numbers on their own. */}
      <div className="mt-3 flex h-1.5 gap-[2px] overflow-hidden">
        {segments.map((segment) => (
          <span
            key={segment.key}
            title={`${segment.count} ${segment.label}`}
            className={cn("rounded-full", segment.fill)}
            style={{ flexGrow: segment.count }}
          />
        ))}
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full bg-accent/60"
          style={{ width: `${tag.percent}%` }}
        />
      </div>

      <p className="mt-1.5 text-xs text-content-subtle">
        {tag.nextTier === null ? (
          <>
            <span className="tabular-nums">{Math.round(tag.points)}</span> mastery points
          </>
        ) : (
          <>
            <span className="tabular-nums">
              {Math.max(0, Math.round((tag.pointsForTier - tag.pointsIntoTier) * 10) / 10)}
            </span>{" "}
            more to {tag.nextTier}
          </>
        )}
      </p>
    </Link>
  );
}
