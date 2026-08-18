"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { saveRepeat } from "@/actions/repeats";
import { REPEAT_RESULTS, REPEAT_RESULT_LABELS, type RepeatResult } from "@/lib/types";
import { cn } from "@/lib/cn";

const RESULT_STYLES: Record<RepeatResult, string> = {
  easy: "has-checked:border-easy has-checked:text-easy",
  struggled: "has-checked:border-medium has-checked:text-medium",
  failed: "has-checked:border-hard has-checked:text-hard",
};

export function RepeatModal({
  problemId,
  today,
  minDate,
}: {
  problemId: number;
  today: string;
  minDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today < minDate ? minDate : today);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<RepeatResult | null>(null);
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setDate(today < minDate ? minDate : today);
    setNotes("");
    setResult(null);
    setMinutes("");
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function submit() {
    startTransition(async () => {
      const trimmed = minutes.trim();
      const response = await saveRepeat({
        problemId,
        date,
        notes,
        result,
        durationMinutes: trimmed.length > 0 ? Number(trimmed) : null,
      });

      if (!response.ok) {
        setError(response.error ?? "Could not save the repeat.");
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Repeat Problem
      </Button>

      <Modal
        open={open}
        title="Repeat Problem"
        description="Log another attempt. The original completion date stays unchanged."
        onClose={close}
        footer={
          <>
            <Button onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={pending}>
              {pending ? "Saving" : "Save Repeat"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="repeat-date">
              <Input
                id="repeat-date"
                type="date"
                value={date}
                min={minDate}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>

            <Field label="Time to solve" htmlFor="repeat-minutes" hint="Optional, in minutes.">
              <Input
                id="repeat-minutes"
                type="number"
                min={0}
                value={minutes}
                placeholder="12"
                onChange={(event) => setMinutes(event.target.value)}
              />
            </Field>
          </div>

          <Field label="How did it go?" hint="Optional.">
            <div className="flex flex-wrap gap-2">
              {REPEAT_RESULTS.map((option) => (
                <label
                  key={option}
                  className={cn(
                    "cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-content-muted transition-colors hover:border-border-strong",
                    RESULT_STYLES[option],
                  )}
                >
                  <input
                    type="radio"
                    name="repeat-result"
                    className="sr-only"
                    checked={result === option}
                    onChange={() => setResult(option)}
                  />
                  {REPEAT_RESULT_LABELS[option]}
                </label>
              ))}
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-content-subtle transition-colors hover:text-content"
              >
                Clear
              </button>
            </div>
          </Field>

          <Field label="Notes" htmlFor="repeat-notes">
            <Textarea
              id="repeat-notes"
              rows={4}
              value={notes}
              placeholder="Solved without looking at the solution. Still struggled with boundary conditions."
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </Modal>
    </>
  );
}
