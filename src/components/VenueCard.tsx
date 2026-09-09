import Link from "next/link";
import { ageRange, familyTotal, priceLine, type Priced } from "@/lib/format";
import { illustrationFor } from "@/lib/illustration";

export type SearchRow = Priced & {
  id: string; slug: string; name: string; area: string | null; indoor_outdoor: "indoor" | "outdoor" | "mixed";
  distance_km: number | string; best_age_min_months: number | null; best_age_max_months: number | null;
  rating_avg: number | string | null; review_count: number; fits_all: boolean; fits_count: number;
  is_sponsored: boolean; last_verified_at: string | null; hero_image_url: string | null;
};

const ioLabel = { indoor: "Indoor", outdoor: "Outdoor", mixed: "In & out" } as const;

export default function VenueCard({ v, kidAges, adults, tagline, categories }: { v: SearchRow; kidAges: number[]; adults: number; tagline?: string | null; categories?: string[] | null }) {
  const total = familyTotal(v, kidAges, adults);
  const fit = kidAges.length === 0 ? null : v.fits_all ? "Fits everyone" : v.fits_count > 0 ? `Fits ${v.fits_count} of ${kidAges.length}` : "Outside their ages";
  return (
    <Link href={`/v/${v.slug}`} className="block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={illustrationFor(categories, v.hero_image_url)} alt="" className="aspect-[4/3] w-full object-cover sm:aspect-[3/1]" />
      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold leading-tight tracking-tight">{v.name}</h2>
          {tagline && <p className="mt-0.5 line-clamp-2 text-sm text-ink/70">{tagline}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${v.indoor_outdoor === "outdoor" ? "bg-sun/40" : v.indoor_outdoor === "mixed" ? "bg-pool/30" : "bg-cobalt/10 text-cobalt"}`}>
          {ioLabel[v.indoor_outdoor]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/80">
        <span>{v.area ?? ""} · {Number(v.distance_km).toFixed(0)} km</span>
        <span>Best for {ageRange(v.best_age_min_months, v.best_age_max_months)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-ink/80">{priceLine(v)}</span>
        {total != null && <span className="rounded-full bg-persimmon px-3 py-1 text-sm font-extrabold text-white">{total === 0 ? "Free" : `~AED ${total} for your family`}</span>}
      </div>
      {fit && <p className={`mt-2 text-xs font-bold ${v.fits_all ? "text-cobalt" : "text-ink/50"}`}>{fit}</p>}
      </div>
    </Link>
  );
}
