"use client";

import { useState } from "react";
import { START_POINTS } from "@/lib/places";
import { GOOD_FOR } from "@/lib/goodfor";

export const AGE_CHIPS: { value: string; label: string }[] = [{ value: "0.5", label: "Under 1" }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })), { value: "14", label: "13+" }];

export default function SearchBar({ ages, indoor, from, near, adults = 1, good = "", sort = "best" }: { ages: string; indoor: string; from: string; near?: string; adults?: number; good?: string; sort?: string }) {
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(near ?? "");
  const [locError, setLocError] = useState("");
  const [picked, setPicked] = useState<string[]>(ages.split(/[,\s]+/).filter(Boolean));
  const count = (v: string) => picked.filter((x) => x === v).length;
  function removeAge(v: string) { setPicked((p) => { const i = p.lastIndexOf(v); return i < 0 ? p : [...p.slice(0, i), ...p.slice(i + 1)]; }); }
  const [where, setWhere] = useState(indoor === "indoor" || indoor === "outdoor" ? indoor : "");

  function locate() {
    if (!navigator.geolocation) { setLocError("Location isn't available on this device."); return; }
    setLocating(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`); setLocating(false); },
      () => { setLocError("Couldn't get your location. Pick an area instead."); setLocating(false); },
      { timeout: 8000, maximumAge: 300000 },
    );
  }
  function addAge(v: string) { setPicked((p) => count(v) >= 4 ? p : [...p, v].sort((a, b) => Number(a) - Number(b))); }

  const field = "min-w-0 w-full h-[46px] rounded-xl border border-ink/15 bg-white px-3 text-base font-medium text-ink outline-none focus:border-cobalt";
  const label = "text-xs font-semibold text-ink/60";
  const seg = (v: string) => `flex-1 rounded-lg text-center text-sm font-bold transition ${where === v ? "bg-sun text-ink shadow-sm" : "text-ink/60"}`;

  return (
    <form method="get" action="/" className="grid gap-3 rounded-3xl bg-white/70 p-3 shadow-sm ring-1 ring-ink/10">
      <div>
        <div className="flex items-baseline justify-between"><span className={label}>Kids&apos; ages</span>{picked.length > 0 && <button type="button" onClick={() => setPicked([])} className="text-xs font-bold text-cobalt">Clear</button>}</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {AGE_CHIPS.map((c) => {
            const n = count(c.value);
            return (
              <span key={c.value} className={`inline-flex items-center overflow-hidden rounded-full text-sm font-bold ring-1 transition ${n ? "bg-sun ring-sun" : "bg-white ring-ink/15 text-ink/70"}`}>
                <button type="button" onClick={() => addAge(c.value)} aria-label={`Add a child aged ${c.label}`} className="min-w-9 px-2.5 py-1">{c.label}{n > 1 && <span className="ml-1 text-xs">×{n}</span>}</button>
                {n > 0 && <button type="button" onClick={() => removeAge(c.value)} aria-label={`Remove a child aged ${c.label}`} className="border-l border-ink/15 px-2 py-1 text-ink/60">−</button>}
              </span>
            );
          })}
        </div>
        <input type="hidden" name="ages" value={picked.join(",")} />
        <p className="mt-1 text-xs text-ink/50">{picked.length === 0 ? "Tap each child's age. Leave empty to see everything." : "Tap again for twins or a friend the same age."}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={label}>Where</span>
          <div className="mt-1 flex h-[46px] rounded-xl border border-ink/15 bg-white p-1">
            {[["", "Any"], ["indoor", "Indoor"], ["outdoor", "Outdoor"]].map(([v, l]) => <button key={v} type="button" onClick={() => setWhere(v)} className={seg(v)}>{l}</button>)}
          </div>
          <input type="hidden" name="indoor" value={where} />
        </div>
        <label className={"flex min-w-0 flex-col gap-1 " + label}>
          Adults going
          <select name="adults" defaultValue={String(adults)} className={field}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className={label}>Starting from</span>
          <button type="button" onClick={locate} className="text-xs font-bold text-cobalt">{locating ? "Locating…" : coords ? "Using my location ✓" : "Use my location"}</button>
        </div>
        <select name="from" defaultValue={coords ? "near" : from} className={field + " mt-1"} onChange={(e) => { if (e.target.value !== "near") setCoords(""); }}>
          {coords && <option value="near">My location</option>}
          {START_POINTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        {locError && <p className="mt-1 text-xs text-persimmon">{locError}</p>}
        <input type="hidden" name="near" value={coords} />
      </div>

      <label className={"flex min-w-0 flex-col gap-1 " + label}>
        Good for
        <select name="good" defaultValue={good} className={field}>
          <option value="">Everyone</option>
          {GOOD_FOR.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
      </label>
      {sort && sort !== "best" && <input type="hidden" name="sort" value={sort} />}
      <button type="submit" className="rounded-xl bg-ink px-4 py-3 text-base font-bold text-oat">Find activities</button>
    </form>
  );
}
