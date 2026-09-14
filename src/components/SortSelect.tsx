"use client";

import { useRouter } from "next/navigation";
import { SORTS } from "@/lib/goodfor";

/** Sort dropdown for the listings. Changing it reloads the results with the new sort, keeping every other filter. */
export default function SortSelect({ sort, hrefs }: { sort: string; hrefs: Record<string, string> }) {
  const router = useRouter();
  return (
    <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink/60">
      Sort
      <select value={sort} onChange={(e) => router.push(hrefs[e.target.value] ?? "/")} className="h-9 rounded-xl border border-ink/15 bg-white px-2 text-sm font-bold text-ink outline-none focus:border-cobalt" aria-label="Sort results">
        {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </label>
  );
}
