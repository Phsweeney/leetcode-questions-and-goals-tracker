import { CountUp } from "@/components/ui/CountUp";
import type { LevelInfo } from "@/lib/progress/xp";

// The one hero number on the page. Everything else is context for it.
export function LevelHero({
  level,
  totalProblems,
  currentStreak,
}: {
  level: LevelInfo;
  totalProblems: number;
  currentStreak: number;
}) {
  return (
    <section className="lt-anim-rise overflow-hidden rounded-xl border border-border bg-surface-raised">
      <div className="flex flex-wrap items-center gap-6 bg-accent-soft px-5 py-6">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-2 border-accent/30 bg-surface">
          <span className="text-[10px] font-medium tracking-wide text-content-muted uppercase">
            Level
          </span>
          <CountUp
            value={level.level}
            className="text-3xl leading-none font-semibold tabular-nums tracking-tight text-accent"
          />
        </div>

        <div className="min-w-56 flex-1">
          <p className="text-lg font-semibold tracking-tight text-content">{level.rank}</p>
          <p className="mt-0.5 text-sm text-content-muted">
            {level.xpToNextLevel.toLocaleString()} XP to level {level.level + 1}
          </p>

          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-sunken"
            role="progressbar"
            aria-valuenow={level.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level ${level.level} progress`}
          >
            <div
              className="lt-anim-grow h-full rounded-full bg-accent"
              style={{ width: `${level.percent}%` }}
            />
          </div>

          <p className="mt-1.5 text-xs tabular-nums text-content-subtle">
            {level.xpIntoLevel.toLocaleString()} / {level.xpForLevel.toLocaleString()} XP
            <span className="mx-1.5 text-border-strong">·</span>
            {level.xpTotal.toLocaleString()} total
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-border border-t border-border sm:grid-cols-3">
        <HeroStat label="Problems solved" value={totalProblems} />
        <HeroStat label="Day streak" value={currentStreak} />
        <HeroStat
          label="Total XP"
          value={level.xpTotal}
          className="col-span-2 border-t border-border sm:col-span-1 sm:border-t-0"
        />
      </dl>
    </section>
  );
}

function HeroStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 ${className ?? ""}`}>
      <dd className="text-2xl font-semibold tabular-nums tracking-tight text-content">
        <CountUp value={value} />
      </dd>
      <dt className="mt-0.5 text-sm text-content-muted">{label}</dt>
    </div>
  );
}
