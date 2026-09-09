"use client";

import { useState } from "react";
import { START_POINTS } from "@/lib/places";

export default function SearchBar({ ages, indoor, from, near, adults = 1 }: { ages: string; indoor: string; from: string; near?: string; adults?: number }) {
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(near ?? "");
  const [locError, setLocError] = useState("");

  function locate() {
    if (!navigator.geolocation) { setLocError("Location isn't available on this device."); return; }
    setLocating(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`); setLocating(false); },
      () => { setLocError("Couldn't get your location. Pick an area instead."); setLocating(false); },
      { timeout: 8000, maximumAge: 300000 },
    );
  }

  const field = "min-w-0 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base font-medium text-ink outline-none focus:border-cobalt";
  return (
    <form method="get" action="/" className="grid grid-cols-2 gap-2 rounded-3xl bg-white/70 p-3 shadow-sm ring-1 ring-ink/10">
      <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink/60">
        Kids&apos; ages (years)
        <input name="ages" defaultValue={ages} placeholder="e.g. 2, 6" className={field} />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink/60">
        Adults going
        <select name="adults" defaultValue={String(adults)} className={field}>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink/60">
        Where
        <select name="indoor" defaultValue={indoor} className={field}>
          <option value="">Anywhere</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink/60">
        Starting from
        <select name="from" defaultValue={coords ? "near" : from} className={field} onChange={(e) => { if (e.target.value !== "near") setCoords(""); }}>
          {coords && <option value="near">My location</option>}
          {START_POINTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </label>
      <input type="hidden" name="near" value={coords} />
      <div className="col-span-2 flex items-center justify-between gap-2">
        <button type="button" onClick={locate} className="text-sm font-bold text-cobalt">{locating ? "Locating…" : coords ? "Using my location ✓" : "Use my location"}</button>
        {locError && <span className="text-xs text-persimmon">{locError}</span>}
      </div>
      <button type="submit" className="col-span-2 rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">What shall we do today?</button>
    </form>
  );
}
