"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalCard } from "@/components/GoalCard";
import { addGoal, editGoal, removeGoal, type GoalFormValues } from "@/actions/goals";
import type { GoalWithProgress } from "@/lib/types";

type Dialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; goal: GoalWithProgress }
  | { kind: "delete"; goal: GoalWithProgress };

function emptyValues(today: string, defaultEnd: string): GoalFormValues {
  return { name: "", targetCount: "50", startDate: today, endDate: defaultEnd };
}

export function GoalManager({
  goals,
  today,
  defaultEndDate,
}: {
  goals: GoalWithProgress[];
  today: string;
  defaultEndDate: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [values, setValues] = useState<GoalFormValues>(emptyValues(today, defaultEndDate));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = goals.filter((goal) => goal.isActive);
  const past = goals.filter((goal) => !goal.isActive);

  function close() {
    setDialog({ kind: "none" });
    setValues(emptyValues(today, defaultEndDate));
    setError(null);
  }

  function openCreate() {
    setValues(emptyValues(today, defaultEndDate));
    setError(null);
    setDialog({ kind: "create" });
  }

  function openEdit(goal: GoalWithProgress) {
    setValues({
      name: goal.name,
      targetCount: String(goal.targetCount),
      startDate: goal.startDate,
      endDate: goal.endDate,
    });
    setError(null);
    setDialog({ kind: "edit", goal });
  }

  function submit() {
    startTransition(async () => {
      let result;
      if (dialog.kind === "create") {
        result = await addGoal(values);
      } else if (dialog.kind === "edit") {
        result = await editGoal(dialog.goal.id, values);
      } else if (dialog.kind === "delete") {
        result = await removeGoal(dialog.goal.id);
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

  function cardActions(goal: GoalWithProgress) {
    return (
      <>
        <Button size="sm" variant="ghost" onClick={() => openEdit(goal)}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={() => setDialog({ kind: "delete", goal })}>
          Delete
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" onClick={openCreate}>
          + Create Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set a target like 100 problems by the end of the year, and progress fills in automatically as you add completed problems."
          action={
            <Button variant="primary" onClick={openCreate}>
              + Create Goal
            </Button>
          }
        />
      ) : null}

      {active.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-content">Active goals</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((goal) => (
              <GoalCard key={goal.id} goal={goal} actions={cardActions(goal)} />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-content">Past goals</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((goal) => (
              <GoalCard key={goal.id} goal={goal} actions={cardActions(goal)} />
            ))}
          </div>
        </section>
      ) : null}

      <Modal
        open={dialog.kind === "create" || dialog.kind === "edit"}
        title={dialog.kind === "edit" ? "Edit goal" : "Create goal"}
        description="Progress counts problems completed between the start date and the deadline."
        onClose={close}
        footer={
          <>
            <Button onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={pending}>
              {pending ? "Saving" : "Save goal"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Goal name" htmlFor="goal-name">
            <Input
              id="goal-name"
              autoFocus
              value={values.name}
              placeholder="Complete 100 LeetCode problems"
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
          </Field>

          <Field label="Target" htmlFor="goal-target" hint="How many problems to complete.">
            <Input
              id="goal-target"
              type="number"
              min={1}
              value={values.targetCount}
              onChange={(event) => setValues({ ...values, targetCount: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start" htmlFor="goal-start">
              <Input
                id="goal-start"
                type="date"
                value={values.startDate}
                onChange={(event) => setValues({ ...values, startDate: event.target.value })}
              />
            </Field>
            <Field label="Deadline" htmlFor="goal-end">
              <Input
                id="goal-end"
                type="date"
                value={values.endDate}
                onChange={(event) => setValues({ ...values, endDate: event.target.value })}
              />
            </Field>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </Modal>

      <Modal
        open={dialog.kind === "delete"}
        title="Delete goal"
        description={
          dialog.kind === "delete"
            ? `"${dialog.goal.name}" will be removed. Your problems are not affected.`
            : undefined
        }
        onClose={close}
        width="max-w-md"
        footer={
          <>
            <Button onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submit} disabled={pending}>
              {pending ? "Deleting" : "Delete goal"}
            </Button>
          </>
        }
      />
    </>
  );
}
