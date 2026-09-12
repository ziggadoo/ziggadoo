import Link from "next/link";
import { ageRange, priceLine, type Priced } from "@/lib/format";
import { illustrationFor } from "@/lib/illustration";

export type SearchRow = Priced & {
  id: string; slug: string; name: string; area: string | null; indoor_outdoor: "indoor" | "outdoor" | "mixed";
  distance_km: number | string; best_age_min_months: number | null; best_age_max_months: number | null;
  rating_avg: number | string | null; review_count: number; fits_all: boolean; fits_count: number;
  is_sponsored: boolean; last_verified_at: string | null; hero_image_url: string | null;
  tagline?: string | null; categories?: string[] | null;
};

const ioLabel = { indoor: "Indoor", outdoor: "Outdoor", mixed: "In & out" } as const;

export default function VenueCard({ v, kidAges, tagline, categories }: { v: SearchRow; kidAges: number[]; tagline?: string | null; categories?: string[] | null }) {
  const fit = kidAges.length === 0 ? null : v.fits_all ? "Fits everyone" : v.fits_count > 0 ? `Fits ${v.fits_count} of ${kidAges.length}` : "Outside their ages";
  const price = priceLine(v);
  const unknown = v.price_model === "unknown";
  return (
    <Link href={`/v/${v.slug}`} className="flex min-w-0 gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={illustrationFor(categories, v.hero_image_url)} alt="" className="h-28 w-24 shrink-0 rounded-2xl object-cover" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 text-[17px] font-extrabold leading-tight tracking-tight">{v.name}</h2>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${v.indoor_outdoor === "outdoor" ? "bg-sun/50" : v.indoor_outdoor === "mixed" ? "bg-pool/30" : "bg-cobalt/10 text-cobalt"}`}>{ioLabel[v.indoor_outdoor]}</span>
        </div>
        {tagline && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink/75">{tagline}</p>}
        <p className="mt-1.5 text-xs text-ink/65">
          <span className="font-semibold text-ink/80">Ages {ageRange(v.best_age_min_months, v.best_age_max_months)}</span>
          <span className="mx-1.5">·</span>{Number(v.distance_km).toFixed(0)} km{v.area ? `, ${v.area}` : ""}
          {v.rating_avg != null && v.review_count > 0 && <><span className="mx-1.5">·</span><span className="font-bold text-sun">★</span> {Number(v.rating_avg).toFixed(1)} ({v.review_count})</>}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <span className={`text-sm ${unknown ? "font-medium text-ink/45" : "font-bold text-ink"}`}>{price}</span>
        </div>
        {fit && <p className={`mt-0.5 text-[11px] font-bold ${v.fits_all ? "text-cobalt" : "text-ink/50"}`}>{fit}</p>}
      </div>
    </Link>
  );
}
