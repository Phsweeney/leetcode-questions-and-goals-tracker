"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// The server renders the final value, so the number is correct before any script
// runs. The animation only ever replays it from zero.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const frame = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion() || target <= 0 || durationMs <= 0) {
      setValue(target);
      return;
    }

    // Reset before the browser paints so the count always starts from zero
    // rather than flashing the final number first.
    setValue(0);
    const start = performance.now();

    function step(now: number) {
      const elapsed = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setValue(Math.round(target * eased));

      if (elapsed < 1) {
        frame.current = requestAnimationFrame(step);
      }
    }

    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [target, durationMs]);

  return value;
}

export function CountUp({
  value,
  durationMs,
  className,
}: {
  value: number;
  durationMs?: number;
  className?: string;
}) {
  const shown = useCountUp(value, durationMs);
  return <span className={className}>{shown.toLocaleString()}</span>;
}
