"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Modal } from "@/components/ui/Modal";
import { removeProblem } from "@/actions/problems";

export function ProblemActions({ id, title }: { id: number; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <LinkButton href={`/problems/${id}/edit`}>Edit</LinkButton>
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete
      </Button>

      <Modal
        open={confirming}
        title="Delete problem"
        description={`"${title}" and its whole review history will be removed. This cannot be undone.`}
        onClose={() => setConfirming(false)}
        width="max-w-md"
        footer={
          <>
            <Button onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => startTransition(() => removeProblem(id))}
            >
              {pending ? "Deleting" : "Delete problem"}
            </Button>
          </>
        }
      />
    </>
  );
}
