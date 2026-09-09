import { createClient } from "@/lib/supabase/server";
import SearchBar from "@/components/SearchBar";
import VenueCard, { type SearchRow } from "@/components/VenueCard";
import { DEFAULT_START, START_POINTS } from "@/lib/places";

export const dynamic = "force-dynamic";

type Params = { ages?: string; indoor?: string; from?: string };

function parseAges(s: string | undefined): number[] {
  if (!s) return [];
  return s.split(/[,\s]+/).map(Number).filter((y) => Number.isFinite(y) && y >= 0 && y <= 18).map((y) => Math.round(y * 12));
}

export default async function Home({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const kidAges = parseAges(sp.ages);
  const start = START_POINTS.find((p) => p.key === sp.from) ?? DEFAULT_START;
  const indoor = sp.indoor === "indoor" || sp.indoor === "outdoor" ? sp.indoor : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_venues", {
    p_lat: start.lat, p_lng: start.lng, p_radius_km: 60, p_child_ages: kidAges, p_indoor: indoor, p_categories: null, p_limit: 40,
  });
  const rows = (data ?? []) as SearchRow[];
  const { data: taglines } = rows.length
    ? await supabase.from("venues").select("id, tagline, categories").in("id", rows.map((r) => r.id))
    : { data: [] as { id: string; tagline: string | null; categories: string[] }[] };
  const metaById = new Map((taglines ?? []).map((t) => [t.id, t]));

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-5 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tracking-tight">ziggadoo</span>
        <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold">Preview</span>
      </header>
      <h1 className="mb-4 text-4xl font-extrabold leading-[1.05] tracking-tight">What shall we do today?</h1>
      <SearchBar ages={sp.ages ?? ""} indoor={sp.indoor ?? ""} from={start.key} />

      {error && <p className="mt-6 text-sm text-persimmon">Couldn&apos;t load places: {error.message}</p>}
      <p className="mt-6 text-sm text-ink/60">
        {rows.length} places from {start.label}{kidAges.length ? `, sorted for ages ${sp.ages}` : ""}. Totals assume 2 adults.
      </p>
      <div className="mt-3 grid gap-3">
        {rows.map((v) => <VenueCard key={v.id} v={v} kidAges={kidAges} adults={2} tagline={metaById.get(v.id)?.tagline} categories={metaById.get(v.id)?.categories} />)}
      </div>
    </main>
  );
}
