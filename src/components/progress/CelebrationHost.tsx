"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { dismissCelebration } from "@/actions/progress";
import { ACHIEVEMENTS_BY_KEY } from "@/lib/progress/achievements";
import { describeLevel } from "@/lib/progress/xp";
import type { CelebrationPayload } from "@/lib/repos/celebration";
import { cn } from "@/lib/cn";

const BASE_MS = 5000;
const WITH_BADGES_MS = 7500;

export function CelebrationHost({ pending }: { pending: CelebrationPayload | null }) {
  const [shown, setShown] = useState<CelebrationPayload | null>(null);
  const [, startTransition] = useTransition();
  // A layout re-render can arrive before the delete commits, so the timestamps
  // already handled are remembered rather than trusting the row to be gone.
  const handled = useRef(new Set<string>());

  const close = useCallback((payload: CelebrationPayload) => {
    setShown(null);
    startTransition(async () => {
      await dismissCelebration(payload.unlockedKeys);
    });
  }, []);

  useEffect(() => {
    if (!pending || handled.current.has(pending.createdAt)) {
      return;
    }
    handled.current.add(pending.createdAt);
    setShown(pending);
  }, [pending]);

  useEffect(() => {
    if (!shown) {
      return;
    }

    const timeout = setTimeout(
      () => close(shown),
      shown.unlockedKeys.length > 0 ? WITH_BADGES_MS : BASE_MS,
    );

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close(shown!);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [shown, close]);

  if (!shown) {
    return null;
  }

  const level = describeLevel(shown.xpTotal);
  const leveledUp = shown.levelAfter > shown.levelBefore;
  const badges = shown.unlockedKeys
    .map((key) => ACHIEVEMENTS_BY_KEY.get(key))
    .filter((def) => def !== undefined);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "lt-anim-overlay pointer-events-auto w-full max-w-sm rounded-xl border bg-surface-raised p-5 shadow-lg",
          leveledUp || badges.length > 0
            ? "border-accent/50 ring-1 ring-accent/20"
            : "border-border",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-content-muted uppercase">
              {shown.kind === "problem" ? "Problem logged" : "Repeat logged"}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-content">
              {shown.title}
            </p>
          </div>
          <p className="shrink-0 text-lg font-semibold tabular-nums text-accent">
            +{shown.xpGained} XP
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs">
            <span className={cn("font-medium", leveledUp ? "text-accent" : "text-content")}>
              {leveledUp ? `Level up — level ${shown.levelAfter}!` : `Level ${level.level}`}
            </span>
            <span className="tabular-nums text-content-subtle">
              {level.xpIntoLevel} / {level.xpForLevel}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="lt-anim-grow h-full rounded-full bg-accent"
              style={{ width: `${level.percent}%` }}
            />
          </div>
        </div>

        {shown.streak > 0 ? (
          <p className="mt-3 text-xs text-content-muted">
            <span className="font-medium tabular-nums text-content">{shown.streak}</span>{" "}
            day streak
          </p>
        ) : null}

        {badges.length > 0 ? (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            {badges.map((def, index) => (
              <div
                key={def.key}
                style={{ animationDelay: `${120 + index * 90}ms` }}
                className="lt-anim-pop rounded-lg bg-accent-soft px-3 py-2"
              >
                <p className="text-xs font-medium tracking-wide text-accent uppercase">
                  Badge unlocked
                </p>
                <p className="mt-0.5 text-sm font-medium text-content">{def.title}</p>
                <p className="text-xs text-content-muted">{def.description}</p>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => close(shown)}
          className="mt-4 w-full rounded-lg px-3 py-1.5 text-xs text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
