"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function AddProblemButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(kind: "leetcode" | "other") {
    setOpen(false);
    router.push(`/problems/new?kind=${kind}`);
  }

  return (
    <>
      <Button variant="primary" className={className} onClick={() => setOpen(true)}>
        + Add Problem
      </Button>

      <Modal
        open={open}
        title="Add Problem"
        description="Both options create the same kind of record. This only changes the starting values."
        onClose={() => setOpen(false)}
        width="max-w-md"
      >
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => go("leetcode")}
            className="rounded-xl border border-border bg-surface px-4 py-4 text-left transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <p className="text-sm font-medium text-content">LeetCode Problem</p>
            <p className="mt-0.5 text-xs text-content-muted">
              Starts on the LeetCode platform with a difficulty selected.
            </p>
          </button>
          <button
            type="button"
            onClick={() => go("other")}
            className="rounded-xl border border-border bg-surface px-4 py-4 text-left transition-colors hover:border-accent hover:bg-accent-soft"
          >
            <p className="text-sm font-medium text-content">Other Problem</p>
            <p className="mt-0.5 text-xs text-content-muted">
              Pick any platform, with difficulty left optional.
            </p>
          </button>
        </div>
      </Modal>
    </>
  );
}
