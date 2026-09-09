import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ageRange, priceLine } from "@/lib/format";
import { illustrationFor } from "@/lib/illustration";
import type { Metadata } from "next";
import VenueActions from "@/components/VenueActions";
import { ageLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAYS: [string, string][] = [["mon","Mon"],["tue","Tue"],["wed","Wed"],["thu","Thu"],["fri","Fri"],["sat","Sat"],["sun","Sun"]];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: v } = await supabase.from("venues").select("name, tagline, area").eq("slug", slug).maybeSingle();
  if (!v) return {};
  const title = `${v.name} in ${v.area}: ages, prices, hours`;
  return { title, description: v.tagline ?? `${v.name}, a kids' activity in ${v.area}, Dubai. Ages, list prices, opening hours and how to book.`, alternates: { canonical: `/v/${slug}` } };
}

export default async function VenuePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { slug } = await params;
  const { msg } = await searchParams;
  const supabase = await createClient();
  const { data: v } = await supabase.from("venues").select("*, locations(name)").eq("slug", slug).maybeSingle();
  if (!v) notFound();
  const [{ data: { user } }, { data: reviews }, { data: stats }, { data: party }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("reviews").select("id, profile_id, rating, would_return, good_value, good_for_party, party_note, loved_it_ages_months, duration_min, body, status, created_at, profiles(display_name)").eq("venue_id", v.id).order("created_at", { ascending: false }),
    supabase.from("venue_stats").select("*").eq("venue_id", v.id).maybeSingle(),
    supabase.from("venue_party_stats").select("*").eq("venue_id", v.id).maybeSingle(),
  ]);
  const myReview = user ? (reviews ?? []).find((r) => r.profile_id === user.id) ?? null : null;
  const publicReviews = (reviews ?? []).filter((r) => r.status === "approved");
  const hours = (v.opening_hours ?? {}) as Record<string, string>;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + " " + (v.address ?? "Dubai"))}`;
  const wa = v.whatsapp ? `https://wa.me/${String(v.whatsapp).replace(/\D/g, "")}` : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["TouristAttraction", "LocalBusiness"],
    name: v.name,
    description: v.tagline ?? v.description ?? undefined,
    url: `https://ziggadoo.com/v/${v.slug}`,
    telephone: v.phone ?? undefined,
    sameAs: v.website ? [v.website] : undefined,
    address: { "@type": "PostalAddress", streetAddress: v.address ?? undefined, addressLocality: "Dubai", addressCountry: "AE" },
    isAccessibleForFree: v.price_model === "free",
    priceRange: v.price_child_aed ? `AED ${v.price_child_aed}` : undefined,
    openingHours: DAYS.filter(([k]) => hours[k]).map(([k, l]) => `${l.slice(0, 2)} ${hours[k]}`),
    audience: { "@type": "PeopleAudience", suggestedMinAge: v.best_age_min_months ? Math.floor(v.best_age_min_months / 12) : undefined, suggestedMaxAge: v.best_age_max_months ? Math.floor(v.best_age_max_months / 12) : undefined },
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="text-sm font-bold text-cobalt">← Back to results</Link>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={illustrationFor(v.categories, v.hero_image_url)} alt="" className="mt-4 aspect-[2/1] w-full rounded-3xl object-cover ring-1 ring-ink/10" />
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
        {v.height_note && <p className="text-sm sm:col-span-2"><span className="font-bold">Tip:</span> {v.height_note}</p>}
        {stats?.review_count ? <p className="text-sm sm:col-span-2"><span className="font-bold">{stats.rating_avg} / 5</span> from {stats.review_count} parent{stats.review_count === 1 ? "" : "s"}{stats.would_return_pct != null ? `, ${stats.would_return_pct}% would go back` : ""}{party?.party_votes ? `, ${party.party_pct}% say good for parties` : ""}</p> : null}
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

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">What parents say</h2>
        {publicReviews.length === 0 && <p className="mt-1 text-sm text-ink/60">No reviews yet. Been here? Be the first.</p>}
        <ul className="mt-2 grid gap-3">
          {publicReviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <div className="flex items-center justify-between text-sm"><span className="font-bold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span><span className="text-ink/50">{((r.profiles as unknown as { display_name: string | null } | null)?.display_name) ?? "A parent"}</span></div>
              {r.loved_it_ages_months?.length ? <p className="mt-1 text-xs text-ink/60">Loved by ages {r.loved_it_ages_months.map((m: number) => ageLabel(m)).join(", ")}{r.duration_min ? ` · stayed ${r.duration_min} min` : ""}</p> : null}
              {r.body && <p className="mt-2 text-sm leading-relaxed">{r.body}</p>}
              {r.good_for_party != null && <p className="mt-2 text-xs font-bold">{r.good_for_party ? "Good for parties" : "Not for parties"}{r.party_note ? `: ${r.party_note}` : ""}</p>}
            </li>
          ))}
        </ul>
      </section>

      <VenueActions venueId={v.id} slug={v.slug} msg={msg} signedIn={!!user} myReview={myReview ? { rating: myReview.rating, status: myReview.status } : null} />
      {user && <form action="/auth/signout" method="post" className="mt-4 text-right"><button className="text-xs text-ink/50 underline">Sign out ({user.email})</button></form>}

      <p className="mt-8 text-xs text-ink/50">Source: {v.source === "ai_seed" ? "AI-assisted research, not yet verified by the ziggadoo team" : v.source}. Prices are list prices without discounts.</p>
    </main>
  );
}
