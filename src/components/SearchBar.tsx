import { START_POINTS } from "@/lib/places";

export default function SearchBar({ ages, indoor, from }: { ages: string; indoor: string; from: string }) {
  return (
    <form method="get" action="/" className="grid grid-cols-2 gap-2 rounded-3xl bg-white/70 p-3 shadow-sm ring-1 ring-ink/10 sm:grid-cols-4">
      <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-ink/60 sm:col-span-1">
        Kids&apos; ages (years)
        <input name="ages" defaultValue={ages} placeholder="e.g. 2, 6" inputMode="text"
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-base font-medium text-ink outline-none focus:border-cobalt" />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink/60">
        Where
        <select name="indoor" defaultValue={indoor} className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-base font-medium text-ink">
          <option value="">Anywhere</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink/60">
        Starting from
        <select name="from" defaultValue={from} className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-base font-medium text-ink">
          {START_POINTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </label>
      <button type="submit" className="col-span-2 rounded-xl bg-ink px-4 py-2.5 font-bold text-oat sm:col-span-4">What shall we do today?</button>
    </form>
  );
}
