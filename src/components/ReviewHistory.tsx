"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { removeRepeat } from "@/actions/repeats";
import { formatLongDate } from "@/lib/dates";
import { REPEAT_RESULT_LABELS, type Repeat, type RepeatResult } from "@/lib/types";
import { cn } from "@/lib/cn";

const RESULT_TONE: Record<RepeatResult, string> = {
  easy: "text-easy",
  struggled: "text-medium",
  failed: "text-hard",
};

function Entry({
  date,
  label,
  tone,
  detail,
  notes,
  onDelete,
  deleting,
}: {
  date: string;
  label: string;
  tone?: string;
  detail?: string;
  notes?: string;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-surface" />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-sm font-medium text-content">{formatLongDate(date)}</p>
          <span className={cn("text-xs font-medium", tone ?? "text-content-muted")}>
            {label}
          </span>
          {detail ? <span className="text-xs text-content-subtle">{detail}</span> : null}
        </div>
        {onDelete ? (
          <Button size="sm" variant="ghost" onClick={onDelete} disabled={deleting}>
            Remove
          </Button>
        ) : null}
      </div>
      {notes && notes.trim().length > 0 ? (
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-content-muted">
          {notes}
        </p>
      ) : null}
    </li>
  );
}

export function ReviewHistory({
  completedDate,
  repeats,
}: {
  completedDate: string;
  repeats: Repeat[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(id: number) {
    startTransition(async () => {
      await removeRepeat(id);
      router.refresh();
    });
  }

  return (
    <ol className="space-y-5 border-l border-border pl-1">
      <Entry date={completedDate} label="Original completion" />
      {repeats.map((repeat) => (
        <Entry
          key={repeat.id}
          date={repeat.date}
          label={repeat.result ? REPEAT_RESULT_LABELS[repeat.result] : "Repeat"}
          tone={repeat.result ? RESULT_TONE[repeat.result] : undefined}
          detail={
            repeat.durationMinutes !== null ? `${repeat.durationMinutes} min` : undefined
          }
          notes={repeat.notes}
          onDelete={() => handleDelete(repeat.id)}
          deleting={pending}
        />
      ))}
    </ol>
  );
}
