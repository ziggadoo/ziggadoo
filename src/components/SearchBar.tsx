"use client";

import { useRef, useState } from "react";
import { START_POINTS } from "@/lib/places";
import { GOOD_FOR } from "@/lib/goodfor";

export const AGE_CHIPS: { value: string; label: string }[] = [{ value: "0.5", label: "Under 1" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })), { value: "14", label: "13+" }];

export default function SearchBar({ ages, indoor, from, near, good = "", sort = "best" }: { ages: string; indoor: string; from: string; near?: string; good?: string; sort?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(near ?? "");
  const [fromKey, setFromKey] = useState(near ? "near" : from);
  const [sortKey, setSortKey] = useState(sort);
  const [locError, setLocError] = useState("");
  const [picked, setPicked] = useState<string[]>(ages.split(/[,\s]+/).filter(Boolean));

  function locate() {
    if (!navigator.geolocation) { setLocError("Location isn't available on this device."); return; }
    setLocating(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
        setCoords(c); setFromKey("near"); setSortKey("distance"); setLocating(false);
        // Build the search URL directly from the form and go, so it can't submit stale values.
        const q = new URLSearchParams();
        if (formRef.current) { new FormData(formRef.current).forEach((v, k) => { if (typeof v === "string" && v) q.set(k, v); }); }
        q.set("from", "near"); q.set("near", c); q.set("sort", "distance");
        window.location.assign(`/?${q.toString()}`);
      },
      () => { setLocError("Couldn't get your location. Pick an area instead."); setLocating(false); },
      { timeout: 8000, maximumAge: 300000 },
    );
  }
  function toggleAge(v: string) { setPicked((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v].sort((a, b) => Number(a) - Number(b))); }

  const field = "min-w-0 w-full h-[46px] rounded-xl border border-ink/15 bg-white px-3 text-base font-medium text-ink outline-none focus:border-cobalt";
  const label = "text-xs font-semibold text-ink/60";

  return (
    <form ref={formRef} method="get" action="/" className="grid gap-3 rounded-3xl bg-white/70 p-3 shadow-sm ring-1 ring-ink/10">
      <div>
        <div className="flex items-baseline justify-between"><span className={label}>Kids&apos; ages</span>{picked.length > 0 && <button type="button" onClick={() => setPicked([])} className="text-xs font-bold text-cobalt">Clear</button>}</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {AGE_CHIPS.map((c) => (
            <button key={c.value} type="button" onClick={() => toggleAge(c.value)} aria-pressed={picked.includes(c.value)} className={`min-w-9 rounded-full px-2.5 py-1 text-sm font-bold ring-1 transition ${picked.includes(c.value) ? "bg-sun ring-sun" : "bg-white ring-ink/15 text-ink/70"}`}>{c.label}</button>
          ))}
        </div>
        <input type="hidden" name="ages" value={picked.join(",")} />
        {picked.length === 0 && <p className="mt-1 text-xs text-ink/50">Tap each child&apos;s age. Leave empty to see everything.</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className={"flex min-w-0 flex-col gap-1 " + label}>
          Where
          <select name="indoor" defaultValue={indoor === "indoor" || indoor === "outdoor" ? indoor : ""} className={field}>
            <option value="">Indoor or outdoor</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>
        </label>
        <label className={"flex min-w-0 flex-col gap-1 " + label}>
          Good for
          <select name="good" defaultValue={good} className={field}>
            <option value="">Everyone</option>
            {GOOD_FOR.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </label>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className={label}>Starting from</span>
          <button type="button" onClick={locate} className="text-xs font-bold text-cobalt">{locating ? "Locating…" : coords && fromKey === "near" ? "Using my location ✓" : "Use my location"}</button>
        </div>
        <select name="from" value={fromKey} className={field + " mt-1"} onChange={(e) => { setFromKey(e.target.value); if (e.target.value !== "near") { setCoords(""); if (sortKey === "distance") setSortKey("best"); } }}>
          {coords && <option value="near">My location</option>}
          {START_POINTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        {locError && <p className="mt-1 text-xs text-persimmon">{locError}</p>}
        <input type="hidden" name="near" value={fromKey === "near" ? coords : ""} />
      </div>

      {sortKey && sortKey !== "best" && <input type="hidden" name="sort" value={sortKey} />}
      <button type="submit" className="rounded-xl bg-ink px-4 py-3 text-base font-bold text-oat">Find activities</button>
    </form>
  );
}
