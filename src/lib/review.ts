export const VALUE_SCALE: { score: number; label: string }[] = [
  { score: 1, label: "Poor value" },
  { score: 2, label: "A bit pricey" },
  { score: 3, label: "Fair" },
  { score: 4, label: "Good value" },
  { score: 5, label: "Great value" },
];
export const valueLabel = (s: number | null | undefined) => VALUE_SCALE.find((v) => v.score === s)?.label ?? null;

/** "Sep 2026" style label for a visited_on date string. */
export function visitedLabel(d: string | null | undefined): string | null {
  if (!d) return null;
  const dt = new Date(d + (d.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
