"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Field, Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PlatformSelect } from "@/components/PlatformSelect";
import { TagPicker } from "@/components/TagPicker";
import type { FormState } from "@/actions/problems";
import { DIFFICULTIES } from "@/lib/types";
import type { Platform, ProblemDetail, Tag } from "@/lib/types";
import { cn } from "@/lib/cn";

export function ProblemForm({
  action,
  platforms,
  tags,
  problem,
  defaultPlatformId,
  defaultCompletedDate,
  submitLabel,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  platforms: Platform[];
  tags: Tag[];
  problem?: ProblemDetail;
  defaultPlatformId?: number;
  defaultCompletedDate: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              name="title"
              autoFocus
              required
              defaultValue={problem?.title ?? ""}
              placeholder="Binary Search"
            />
          </Field>
          {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title}</p> : null}
        </div>

        <div className="md:col-span-2">
          <Field
            label="Problem URL"
            htmlFor="url"
            hint="Optional. Opens the original problem in a new tab."
          >
            <Input
              id="url"
              name="url"
              type="url"
              defaultValue={problem?.url ?? ""}
              placeholder="https://leetcode.com/problems/binary-search/"
            />
          </Field>
          {errors.url ? <p className="mt-1 text-xs text-danger">{errors.url}</p> : null}
        </div>

        <div>
          <Field label="Platform">
            <PlatformSelect
              name="platformId"
              platforms={platforms}
              defaultValue={problem?.platformId ?? defaultPlatformId}
            />
          </Field>
          {errors.platformId ? (
            <p className="mt-1 text-xs text-danger">{errors.platformId}</p>
          ) : null}
        </div>

        <div>
          <Field label="Completed" htmlFor="completedDate">
            <Input
              id="completedDate"
              name="completedDate"
              type="date"
              required
              defaultValue={problem?.completedDate ?? defaultCompletedDate}
            />
          </Field>
          {errors.completedDate ? (
            <p className="mt-1 text-xs text-danger">{errors.completedDate}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <Field label="Difficulty" hint="Leave as None for platforms that do not rate problems.">
            <DifficultyChoice defaultValue={problem?.difficulty ?? null} />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Tags">
            <TagPicker
              name="tagIds"
              tags={tags}
              defaultSelectedIds={problem?.tags.map((tag) => tag.id) ?? []}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Summary" hint="A concise explanation of the problem and its solution.">
            <Textarea
              name="summary"
              defaultValue={problem?.summary ?? ""}
              placeholder="Use binary search because the array is sorted. Maintain left and right pointers and repeatedly check the midpoint."
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Notes" hint="Anything you want to remember next time.">
            <Textarea
              name="notes"
              defaultValue={problem?.notes ?? ""}
              placeholder="I initially tried linear search. Remember that right should be len(nums) - 1."
            />
          </Field>
        </div>
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex items-center gap-2 border-t border-border pt-5">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving" : submitLabel}
        </Button>
        <LinkButton href={cancelHref}>Cancel</LinkButton>
      </div>
    </form>
  );
}

function DifficultyChoice({ defaultValue }: { defaultValue: string | null }) {
  const options = [...DIFFICULTIES, "None"];
  const current = defaultValue ?? "None";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option}
          className={cn(
            "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors",
            "border-border text-content-muted hover:border-border-strong",
            "has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent",
          )}
        >
          <input
            type="radio"
            name="difficulty"
            value={option === "None" ? "" : option}
            defaultChecked={current === option}
            className="sr-only"
          />
          {option}
        </label>
      ))}
    </div>
  );
}
