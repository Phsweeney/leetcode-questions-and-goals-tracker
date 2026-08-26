"use client";

import { useState, useTransition } from "react";
import { acknowledgeAchievements } from "@/actions/progress";
import { Button } from "@/components/ui/Button";
import { ACHIEVEMENTS_BY_KEY } from "@/lib/progress/achievements";

// Shown once, the first time /progress opens against a log that already had
// history. After this the overlay handles unlocks one at a time.
export function FirstRunReveal({ keys }: { keys: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();

  const badges = keys
    .map((key) => ACHIEVEMENTS_BY_KEY.get(key))
    .filter((def) => def !== undefined);

  if (dismissed || badges.length === 0) {
    return null;
  }

  function acknowledge() {
    setDismissed(true);
    startTransition(async () => {
      await acknowledgeAchievements();
    });
  }

  return (
    <section className="lt-anim-rise rounded-xl border border-accent/40 bg-accent-soft p-5 ring-1 ring-accent/15">
      <h2 className="text-sm font-semibold text-content">
        You have already earned {badges.length}{" "}
        {badges.length === 1 ? "badge" : "badges"}
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        Everything below was unlocked by work you had already logged. From here on you
        will see them as you earn them.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((def, index) => (
          <div
            key={def.key}
            style={{ animationDelay: `${Math.min(index * 45, 600)}ms` }}
            className="lt-anim-pop rounded-lg border border-accent/25 bg-surface px-3 py-2"
          >
            <p className="text-sm font-medium text-content">{def.title}</p>
            <p className="text-xs text-content-muted">{def.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Button type="button" onClick={acknowledge} disabled={pending} size="sm">
          Nice
        </Button>
      </div>
    </section>
  );
}
