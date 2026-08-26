// One shared ladder so the month calendar and the year heatmap read identically.
// Sequential magnitude, so it is a single hue getting darker - never a rainbow.
export function intensityFill(total: number): string {
  if (total === 0) {
    return "bg-surface-sunken";
  }
  if (total === 1) {
    return "bg-accent/25";
  }
  if (total <= 3) {
    return "bg-accent/50";
  }
  return "bg-accent";
}

export function intensityClass(total: number): string {
  if (total === 0) {
    return "bg-surface-sunken text-content-subtle";
  }
  if (total > 3) {
    return "bg-accent text-white";
  }
  return `${intensityFill(total)} text-content`;
}
