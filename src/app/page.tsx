import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchBar from "@/components/SearchBar";
import VenueCard, { type SearchRow } from "@/components/VenueCard";
import { DEFAULT_START, START_POINTS } from "@/lib/places";
import { goodFor, SORTS, type SortKey } from "@/lib/goodfor";
import Logo from "@/components/Logo";
import { getViewer } from "@/lib/supabase/viewer";

export const dynamic = "force-dynamic";

type Params = { ages?: string; indoor?: string; from?: string; near?: string; hs?: string; good?: string; sort?: string; q?: string };

function parseAges(s: string | undefined): number[] {
  if (!s) return [];
  return s.split(/[,\s]+/).map(Number).filter((y) => Number.isFinite(y) && y >= 0 && y <= 18).map((y) => Math.round(y * 12));
}

/** Price used for sorting: the lowest listed ticket price. Unknown prices sort last. */
function sortPrice(v: SearchRow): number {
  if (v.price_model === "free") return 0;
  const child = v.price_child_aed == null ? null : Number(v.price_child_aed);
  return child ?? Number.POSITIVE_INFINITY;
}

export default async function Home({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const kidAges = parseAges(sp.ages);
  const nearMatch = sp.from === "near" && sp.near ? sp.near.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/) : null;
  const start = nearMatch
    ? { key: "near", label: "your location", lat: Number(nearMatch[1]), lng: Number(nearMatch[2]) }
    : (START_POINTS.find((p) => p.key === sp.from) ?? DEFAULT_START);
  const good = goodFor(sp.good) ?? (sp.hs === "1" ? goodFor("homeschool") : null);
  const indoor = sp.indoor === "indoor" || sp.indoor === "outdoor" ? sp.indoor : null;
  const sort: SortKey = (SORTS.find((s) => s.key === sp.sort)?.key ?? "best") as SortKey;

  const supabase = await createClient();
  const { user } = await getViewer();
  const { data: savedRows } = user ? await supabase.from("saved_venues").select("venue_id").eq("profile_id", user.id).eq("kind", "saved") : { data: [] as { venue_id: string }[] };
  const savedIds = new Set((savedRows ?? []).map((r) => r.venue_id));
  const { data, error } = await supabase.rpc("search_venues", {
    p_lat: start.lat, p_lng: start.lng, p_radius_km: 60, p_child_ages: kidAges, p_indoor: indoor, p_categories: good ? [good.key] : null, p_limit: 80,
  });
  let rows = [...((data ?? []) as SearchRow[])];
  const q = (sp.q ?? "").trim().toLowerCase();
  if (q) {
    const words = q.split(/\s+/).filter(Boolean);
    const extra = new Map<string, string>();
    const { data: ex } = await supabase.from("venues").select("id, aliases, description").in("id", rows.map((r) => r.id));
    (ex ?? []).forEach((e) => extra.set(e.id, [...(e.aliases ?? []), e.description ?? ""].join(" ")));
    rows = rows.filter((r) => {
      const hay = [r.name, r.tagline ?? "", r.area ?? "", (r.categories ?? []).join(" "), extra.get(r.id) ?? ""].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  if (sort === "distance") rows.sort((a, b) => Number(a.distance_km) - Number(b.distance_km));
  if (sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "rated") rows.sort((a, b) => (Number(b.rating_avg ?? 0) - Number(a.rating_avg ?? 0)) || (b.review_count - a.review_count) || Number(a.distance_km) - Number(b.distance_km));
  if (sort === "price") rows.sort((a, b) => sortPrice(a) - sortPrice(b) || Number(a.distance_km) - Number(b.distance_km));

  const selfQs = new URLSearchParams(Object.entries(sp).filter(([, v]) => !!v) as [string, string][]).toString();
  const backHref = selfQs ? `/?${selfQs}` : "/";
  const sortHref = (key: string) => {
    const q = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => { if (v && k !== "sort") q.set(k, v); });
    if (key !== "best") q.set("sort", key);
    const qs = q.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">{user && <Link href="/saved" className="text-xs font-bold text-cobalt">♥ My places</Link>}<span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold">Preview</span></div>
      </header>
      <h1 className="mb-4 text-4xl font-extrabold leading-[1.05] tracking-tight">What shall we do today?</h1>
      <SearchBar ages={sp.ages ?? ""} indoor={sp.indoor ?? ""} from={start.key} near={nearMatch ? sp.near : ""} good={good?.key ?? ""} sort={sort} q={sp.q ?? ""} />

      {error && <p className="mt-6 text-sm text-persimmon">Couldn&apos;t load places: {error.message}</p>}
      {good && <p className="mt-5 rounded-2xl bg-sun/30 px-3 py-2 text-sm"><span className="font-bold">{good.label}.</span> {good.note}</p>}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-ink/60">
          {rows.length} places{q ? ` matching "${sp.q?.trim()}"` : ""} from {start.label}{kidAges.length ? `, for ${kidAges.map((m) => m < 12 ? "under 1" : m >= 168 ? "13+" : String(Math.round(m / 12))).join(", ")}` : ""}.
        </p>
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        {SORTS.map((s) => (
          <Link key={s.key} href={sortHref(s.key)} scroll={false} className={`shrink-0 rounded-full px-3 py-1 ring-1 ${sort === s.key ? "bg-sun ring-sun" : "bg-white ring-ink/15 text-ink/70"}`}>{s.label}</Link>
        ))}
      </div>
      <div className="mt-3 grid min-w-0 gap-3">
        {rows.map((v) => <VenueCard key={v.id} v={v} kidAges={kidAges} tagline={v.tagline} categories={v.categories} saved={savedIds.has(v.id)} signedIn={!!user} back={backHref} />)}
      </div>
      {rows.length === 0 && !error && <p className="mt-6 rounded-2xl bg-white p-4 text-sm ring-1 ring-ink/10">Nothing matches yet. Try a different word, clear the Good for filter, or pick a different starting area.</p>}
    </main>
  );
}
