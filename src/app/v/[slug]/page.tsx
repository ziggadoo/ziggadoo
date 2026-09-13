import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ageRange, priceLine } from "@/lib/format";
import { illustrationFor } from "@/lib/illustration";
import type { Metadata } from "next";
import VenueActions from "@/components/VenueActions";
import { valueLabel, visitedLabel } from "@/lib/review";
import { toggleSaved } from "./actions";
import Logo from "@/components/Logo";
import { ageLabel } from "@/lib/format";
import { cache } from "react";
import { getViewer } from "@/lib/supabase/viewer";
import { aed } from "@/lib/pass";

export const dynamic = "force-dynamic";

// One venue fetch per request, shared by generateMetadata and the page.
const getVenue = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("venues").select("*, locations(name)").eq("slug", slug).maybeSingle();
  return data;
});

const DAYS: [string, string][] = [["mon","Mon"],["tue","Tue"],["wed","Wed"],["thu","Thu"],["fri","Fri"],["sat","Sat"],["sun","Sun"]];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVenue(slug);
  if (!v) return {};
  const title = `${v.name} in ${v.area}: ages, prices, hours`;
  return { title, description: v.tagline ?? `${v.name}, a kids' activity in ${v.area}, Dubai. Ages, list prices, opening hours and how to book.`, alternates: { canonical: `/v/${slug}` } };
}

export default async function VenuePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { slug } = await params;
  const { msg } = await searchParams;
  const supabase = await createClient();
  const v = await getVenue(slug);
  if (!v) notFound();
  const [{ user }, { data: reviews }, { data: stats }, { data: party }, { data: photos }, { data: tickets }, { data: branches }] = await Promise.all([
    getViewer(),
    supabase.from("reviews").select("id, profile_id, rating, would_return, good_value, value_score, visited_on, good_for_party, party_note, loved_it_ages_months, duration_min, body, status, created_at, profiles(display_name)").eq("venue_id", v.id).order("created_at", { ascending: false }),
    supabase.from("venue_stats").select("*").eq("venue_id", v.id).maybeSingle(),
    supabase.from("venue_party_stats").select("*").eq("venue_id", v.id).maybeSingle(),
    supabase.from("venue_photos").select("id, storage_path, caption, is_community").eq("venue_id", v.id).eq("status", "approved").order("sort_order"),
    supabase.from("ticket_types").select("id, name, description, price_aed, ziggadoo_price_aed").eq("venue_id", v.id).eq("active", true).order("sort_order"),
    v.chain ? supabase.from("venues").select("slug, name, area").eq("chain", v.chain).neq("id", v.id).eq("status", "verified").not("published_at", "is", null).order("name") : Promise.resolve({ data: [] as { slug: string; name: string; area: string | null }[] }),
  ]);
  const [{ data: me }, { data: marks }] = user ? await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("saved_venues").select("kind").eq("profile_id", user.id).eq("venue_id", v.id),
  ]) : [{ data: null }, { data: [] }];
  const isSaved = (marks ?? []).some((m) => m.kind === "saved");
  const isBeen = (marks ?? []).some((m) => m.kind === "been");
  const todayKey = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dubai", weekday: "short" }).format(new Date()).toLowerCase();
  const confirmedRecently = v.prices_confirmed_at && Date.now() - new Date(v.prices_confirmed_at).getTime() < 45 * 86400000;
  const hasPasses = !!v.passes_enabled && (tickets ?? []).some((t) => t.ziggadoo_price_aed != null);
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
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex items-center justify-between"><Link href="/" className="text-sm font-bold text-cobalt">← Back to results</Link><Logo className="h-6" /></div>
      <div id="top" className="mt-3 flex gap-2 text-xs font-bold">
        {[["saved", isSaved, "♥ Saved", "♡ Save"], ["been", isBeen, "✓ We've been here", "Been here?"]].map(([kind, on, onLabel, offLabel]) => (
          <form key={String(kind)} action={user ? toggleSaved : undefined}>
            <input type="hidden" name="venue_id" value={v.id} /><input type="hidden" name="slug" value={v.slug} /><input type="hidden" name="kind" value={String(kind)} /><input type="hidden" name="on" value={on ? "0" : "1"} />
            {user ? <button className={`rounded-full px-3 py-1.5 ring-1 ${on ? "bg-sun ring-sun" : "bg-white ring-ink/15 text-ink/70"}`}>{on ? String(onLabel) : String(offLabel)}</button>
              : <Link href={`/login?next=/v/${v.slug}`} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/15 text-ink/70">{String(offLabel)}</Link>}
          </form>
        ))}
        {user && <Link href="/saved" className="ml-auto self-center text-cobalt">My places →</Link>}
      </div>
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
        {v.pro_tip && <p className="rounded-xl bg-sun/40 px-3 py-2 text-sm sm:col-span-2"><span className="font-bold">Pro tip:</span> {v.pro_tip}</p>}
        {confirmedRecently && <p className="text-xs font-bold text-cobalt sm:col-span-2">Prices and hours confirmed by the venue {new Date(v.prices_confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>}
        {stats?.review_count ? <p className="flex flex-wrap items-center gap-x-2 text-sm sm:col-span-2"><span className="text-lg leading-none text-sun" aria-label={`${stats.rating_avg} out of 5`}>{"★".repeat(Math.round(Number(stats.rating_avg)))}<span className="text-ink/15">{"★".repeat(5 - Math.round(Number(stats.rating_avg)))}</span></span><span className="font-bold">{stats.rating_avg}</span><span className="text-ink/60">({stats.review_count} review{stats.review_count === 1 ? "" : "s"})</span>{party?.party_pct != null ? <span className="text-ink/60">· {party.party_pct}% of {party.party_votes} parents say good for parties</span> : null}</p> : null}
      </section>

      {msg === "nopass" && <p className="mt-4 rounded-2xl bg-sun/40 px-3 py-2 text-sm">Passes aren&apos;t available for that ticket right now.</p>}
      {tickets && tickets.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Tickets</h2>
          {hasPasses && <p className="mt-1 text-sm text-ink/70">Get a free Ziggadoo pass, show it at the door and pay the Ziggadoo price there. Nothing charged, nothing reserved.</p>}
          <ul className="mt-2 grid gap-2">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10">
                <div className="min-w-0">
                  <p className="font-bold">{t.name}</p>
                  {t.description && <p className="text-xs text-ink/70">{t.description}</p>}
                  <p className="mt-0.5 text-sm">
                    {t.ziggadoo_price_aed != null && hasPasses ? <><span className="font-extrabold text-persimmon">{aed(t.ziggadoo_price_aed)}</span>{t.price_aed != null && Number(t.price_aed) !== Number(t.ziggadoo_price_aed) && <span className="ml-1 text-ink/50 line-through">{aed(t.price_aed)}</span>}</> : <span className="font-bold">{aed(t.price_aed) || "Ask the venue"}</span>}
                  </p>
                </div>
                {t.ziggadoo_price_aed != null && hasPasses && <Link href={`/pass/new?venue=${v.slug}&ticket=${t.id}`} className="shrink-0 rounded-xl bg-sun px-3 py-2 text-sm font-extrabold">Get pass</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {v.description && <p className="mt-6 leading-relaxed">{v.description}</p>}
      {v.good_to_know && (
        <section className="mt-5 rounded-3xl bg-white p-4 ring-1 ring-ink/10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Good to know</h2>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{v.good_to_know}</p>
        </section>
      )}

      {photos && photos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Photos</h2>
          <ul className="mt-2 flex snap-x gap-3 overflow-x-auto pb-2">
            {photos.map((p) => (
              <li key={p.id} className="w-64 shrink-0 snap-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.storage_path} alt={p.caption ?? ""} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover ring-1 ring-ink/10" />
                {p.caption && <p className="mt-1.5 text-xs leading-snug text-ink/75">{p.caption}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {v.seasonal_notes && <p className="mt-3 rounded-2xl bg-sun/30 p-3 text-sm">{v.seasonal_notes}</p>}

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Opening hours</h2>
        {hours.note && <p className="mt-1 text-sm">{hours.note}</p>}
        {DAYS.some(([k]) => hours[k]) && (
          <details className="mt-1 rounded-2xl bg-white px-3 py-2 ring-1 ring-ink/10">
            <summary className="cursor-pointer text-sm"><span className="font-bold">Today:</span> {hours[todayKey] ? (hours[todayKey].toLowerCase() === "closed" ? "Closed" : hours[todayKey]) : "Not listed"}<span className="ml-2 text-xs text-ink/50">See the week</span></summary>
            <ul className="mt-2 grid grid-cols-2 gap-x-6 text-sm sm:grid-cols-4">
              {DAYS.filter(([k]) => hours[k]).map(([k, label]) => <li key={k} className={`flex justify-between ${k === todayKey ? "font-bold" : ""}`}><span className="text-ink/60">{label}</span><span>{hours[k]}</span></li>)}
            </ul>
          </details>
        )}
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {v.booking_url && <a href={v.booking_url} target="_blank" rel="noreferrer" className="rounded-2xl bg-ink px-4 py-2.5 font-bold text-oat">{v.booking === "required" ? "Book (required)" : "Book"}</a>}
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="rounded-2xl bg-pool px-4 py-2.5 font-bold text-ink">WhatsApp</a>}
        {v.phone && <a href={`tel:${v.phone}`} className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Call</a>}
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Directions</a>
        {v.website && <a href={v.website} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Website</a>}
        {v.instagram && <a href={`https://instagram.com/${String(v.instagram).replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-2.5 font-bold ring-1 ring-ink/15">Instagram</a>}
      </section>

      {branches && branches.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Other {v.chain} branches</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
            {branches.map((b) => <li key={b.slug}><Link href={`/v/${b.slug}`} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/15">{b.name}{b.area ? <span className="ml-1 font-normal text-ink/50">{b.area}</span> : null}</Link></li>)}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">What parents say</h2>
        {publicReviews.length === 0 && <p className="mt-1 text-sm text-ink/60">No reviews yet. Been here? Be the first.</p>}
        <ul className="mt-2 grid gap-3">
          {publicReviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <div className="flex items-center justify-between text-sm"><span className="font-bold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span><span className="text-ink/50">{((r.profiles as unknown as { display_name: string | null } | null)?.display_name) ?? "A parent"}</span></div>
              {(r.loved_it_ages_months?.length || r.visited_on || r.value_score) ? <p className="mt-1 text-xs text-ink/60">{[visitedLabel(r.visited_on) ? `Visited ${visitedLabel(r.visited_on)}` : null, r.loved_it_ages_months?.length ? `loved by ages ${r.loved_it_ages_months.map((m: number) => ageLabel(m)).join(", ")}` : null, r.duration_min ? `stayed ${r.duration_min} min` : null, valueLabel(r.value_score)?.toLowerCase()].filter(Boolean).join(" · ")}</p> : null}
              {r.body && <p className="mt-2 text-sm leading-relaxed">{r.body}</p>}
              {r.good_for_party != null && <p className="mt-2 text-xs"><span className="rounded-full bg-sun px-2 py-0.5 font-bold">Reviewer says: {r.good_for_party ? "good for parties" : "not for parties"}</span>{r.party_note ? <span className="ml-2 text-ink/70">{r.party_note}</span> : null}</p>}
            </li>
          ))}
        </ul>
      </section>

      <VenueActions venueId={v.id} slug={v.slug} msg={msg} signedIn={!!user} displayName={me?.display_name ?? null} myReview={myReview ? { rating: myReview.rating, status: myReview.status, value_score: myReview.value_score, visited_on: myReview.visited_on, would_return: myReview.would_return, good_for_party: myReview.good_for_party, body: myReview.body } : null} claimed={!!v.claimed_by} />
      {user && <form action="/auth/signout" method="post" className="mt-4 text-right"><button className="text-xs text-ink/50 underline">Sign out ({user.email})</button></form>}

      <nav className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-ink/10 bg-oat/95 px-3 py-2 backdrop-blur sm:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {v.booking_url ? <a href={v.booking_url} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-ink px-3 py-2.5 text-center text-sm font-bold text-oat">Book</a> : wa ? <a href={wa} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-ink px-3 py-2.5 text-center text-sm font-bold text-oat">WhatsApp</a> : null}
        {v.booking_url && wa && <a href={wa} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-pool px-3 py-2.5 text-center text-sm font-bold">WhatsApp</a>}
        {v.phone && <a href={`tel:${v.phone}`} className="flex-1 rounded-xl bg-white px-3 py-2.5 text-center text-sm font-bold ring-1 ring-ink/15">Call</a>}
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-white px-3 py-2.5 text-center text-sm font-bold ring-1 ring-ink/15">Directions</a>
      </nav>

      <p className="mt-8 text-xs text-ink/50">Source: {v.source === "ai_seed" ? "AI-assisted research, not yet verified by the ziggadoo team" : v.source}. Prices are list prices without discounts.</p>
    </main>
  );
}
