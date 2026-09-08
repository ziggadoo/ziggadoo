import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ageRange, priceLine } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAYS: [string, string][] = [["mon","Mon"],["tue","Tue"],["wed","Wed"],["thu","Thu"],["fri","Fri"],["sat","Sat"],["sun","Sun"]];

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: v } = await supabase.from("venues").select("*, locations(name)").eq("slug", slug).maybeSingle();
  if (!v) notFound();
  const hours = (v.opening_hours ?? {}) as Record<string, string>;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + " " + (v.address ?? "Dubai"))}`;
  const wa = v.whatsapp ? `https://wa.me/${String(v.whatsapp).replace(/\D/g, "")}` : null;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <Link href="/" className="text-sm font-bold text-cobalt">← Back to results</Link>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-cobalt/10 px-2.5 py-1 text-cobalt">{v.indoor_outdoor === "mixed" ? "Indoor & outdoor" : v.indoor_outdoor[0].toUpperCase() + v.indoor_outdoor.slice(1)}</span>
        {v.locations?.name && <span className="rounded-full bg-ink/5 px-2.5 py-1">{v.locations.name}</span>}
        <span className="rounded-full bg-ink/5 px-2.5 py-1">{v.area}</span>
      </div>
      <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight">{v.name}</h1>
      {v.tagline && <p className="mt-2 text-lg text-ink/75">{v.tagline}</p>}

      <section className="mt-6 grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:grid-cols-2">
        <div><p className="text-xs font-bold uppercase tracking-wide text-ink/50">Best for</p><p className="font-semibold">{ageRange(v.best_age_min_months, v.best_age_max_months)}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-wide text-ink/50">Allowed</p><p className="font-semibold">{ageRange(v.age_min_months, v.age_max_months)}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-wide text-ink/50">Price</p><p className="font-semibold">{priceLine(v)}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-wide text-ink/50">Typical visit</p><p className="font-semibold">{v.typical_duration_min ? `${v.typical_duration_min >= 120 ? Math.round(v.typical_duration_min / 60) + " hours" : v.typical_duration_min + " min"}` : "—"}</p></div>
        {v.price_notes && <p className="text-sm text-ink/70 sm:col-span-2">{v.price_notes}</p>}
      </section>

      {v.description && <p className="mt-6 leading-relaxed">{v.description}</p>}
      {v.seasonal_notes && <p className="mt-3 rounded-2xl bg-sun/30 p-3 text-sm">{v.seasonal_notes}</p>}

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Opening hours</h2>
        {hours.note && <p className="mt-1 text-sm">{hours.note}</p>}
        <ul className="mt-1 grid grid-cols-2 gap-x-6 text-sm sm:grid-cols-4">
          {DAYS.filter(([k]) => hours[k]).map(([k, label]) => <li key={k} className="flex justify-between"><span className="text-ink/60">{label}</span><span>{hours[k]}</span></li>)}
        </ul>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {v.booking_url && <a href={v.booking_url} target="_blank" rel="noreferrer" className="rounded-2xl bg-ink px-4 py-2.5 font-bold text-oat">{v.booking === "required" ? "Book (required)" : "Book"}</a>}
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="rounded-2xl bg-pool px-4 py-2.5 font-bold text-ink">WhatsApp</a>}
        {v.phone && <a href={`tel:${v.phone}`} className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Call</a>}
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Directions</a>
        {v.website && <a href={v.website} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Website</a>}
      </section>

      <p className="mt-8 text-xs text-ink/50">Source: {v.source === "ai_seed" ? "AI-assisted research, not yet verified by the ziggadoo team" : v.source}. Prices are list prices without discounts.</p>
    </main>
  );
}
