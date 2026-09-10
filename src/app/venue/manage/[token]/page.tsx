import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import Logo from "@/components/Logo";
import { TAGLINE_MAX } from "@/lib/venueForm";
import { saveSelf, confirmSelf } from "./actions";
import TicketRows from "@/components/TicketRows";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit your listing", robots: { index: false } };
const field = "mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-base outline-none focus:border-cobalt";
const DAYS: [string, string][] = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]];

export default async function ManageVenue({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { token } = await params; const { msg } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(token)) notFound();
  const db = adminClient();
  const { data: t } = await db.from("venue_manage_tokens").select("venue_id, expires_at").eq("token", token).maybeSingle();
  if (!t) notFound();
  const expired = new Date(t.expires_at) < new Date();
  const { data: v } = await db.from("venues").select("id, name, slug, tagline, whatsapp, phone, website, booking_url, price_notes, height_note, opening_hours, contact_name, contact_whatsapp, prices_confirmed_at, passes_enabled").eq("id", t.venue_id).maybeSingle();
  if (!v) notFound();
  const { data: tickets } = await db.from("ticket_types").select("id, name, description, price_aed, ziggadoo_price_aed").eq("venue_id", v.id).eq("active", true).order("sort_order");
  const hours = (v.opening_hours ?? {}) as Record<string, string>;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center justify-between"><Logo /><a href={`/v/${v.slug}`} className="text-sm font-bold text-cobalt">View listing →</a></div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{v.name}</h1>
      {expired ? <p className="mt-4 rounded-2xl bg-persimmon/15 p-4">This link has expired. <a href="/venue/manage" className="font-bold text-cobalt">Request a new one</a>.</p> : (
        <>
          <p className="mt-2 text-ink/75">{v.prices_confirmed_at ? `Last confirmed ${new Date(v.prices_confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.` : "Not yet confirmed by you."} Parents see &quot;confirmed by the venue&quot; on your listing when this is recent.</p>
          {msg === "saved" && <p className="mt-3 rounded-2xl bg-pool/30 px-3 py-2 text-sm">Saved and confirmed. Thank you.</p>}
          {msg === "confirmed" && <p className="mt-3 rounded-2xl bg-pool/30 px-3 py-2 text-sm">Confirmed. We&apos;ll check in again next month.</p>}
          {msg && !["saved", "confirmed"].includes(msg) && <p className="mt-3 rounded-2xl bg-persimmon/15 px-3 py-2 text-sm">{msg}</p>}

          <form action={confirmSelf.bind(null, token)} className="mt-4 rounded-3xl bg-sun/40 p-4">
            <p className="font-bold">Nothing changed?</p>
            <p className="mt-1 text-sm">If your tickets, prices and hours below are still right, one tap is all we need.</p>
            <button className="mt-3 rounded-xl bg-ink px-4 py-2.5 font-bold text-oat">Everything is still correct</button>
          </form>

          <form action={saveSelf.bind(null, token)} className="mt-6 grid gap-6">
            <fieldset className="grid gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-ink/10">
              <legend className="px-1 text-lg font-extrabold">Tickets and prices</legend>
              <p className="-mt-1 text-sm text-ink/70">One row per ticket: 1 hour, 2 hours, day pass, annual pass, a class, whatever you sell. List price is what you charge at the door. The Ziggadoo price is what families pay when they show a Ziggadoo pass{v.passes_enabled ? "" : " (passes aren't live for you yet, we'll confirm together)"}; leave it blank if there's no special price.</p>
              <TicketRows tickets={tickets ?? []} />
              <label className="text-xs font-semibold text-ink/60">Anything else about prices<textarea name="price_notes" rows={2} defaultValue={v.price_notes ?? ""} className={field} /></label>
            </fieldset>

            <fieldset className="grid gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-ink/10 sm:grid-cols-2">
              <legend className="px-1 text-lg font-extrabold">Opening hours</legend>
              {DAYS.map(([k, l]) => <label key={k} className="text-xs font-semibold text-ink/60">{l}<input name={`hours_${k}`} defaultValue={hours[k] ?? ""} placeholder="10:00-22:00 or closed" className={field} /></label>)}
              <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Seasonal note<input name="hours_note" defaultValue={hours.note ?? ""} placeholder="e.g. Summer: closes 20:00" className={field} /></label>
            </fieldset>

            <fieldset className="grid gap-3 rounded-3xl bg-white/70 p-4 ring-1 ring-ink/10 sm:grid-cols-2">
              <legend className="px-1 text-lg font-extrabold">Listing and contact</legend>
              <label className="text-xs font-semibold text-ink/60 sm:col-span-2">What children do here, one line (max {TAGLINE_MAX} characters)<input name="tagline" defaultValue={v.tagline ?? ""} maxLength={TAGLINE_MAX} className={field} /></label>
              <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Height or age rules shown to parents<input name="height_note" defaultValue={v.height_note ?? ""} className={field} /></label>
              <label className="text-xs font-semibold text-ink/60">WhatsApp for parents<input name="whatsapp" type="tel" defaultValue={v.whatsapp ?? ""} className={field} /></label>
              <label className="text-xs font-semibold text-ink/60">Phone<input name="phone" type="tel" defaultValue={v.phone ?? ""} className={field} /></label>
              <label className="text-xs font-semibold text-ink/60">Website<input name="website" type="url" defaultValue={v.website ?? ""} className={field} /></label>
              <label className="text-xs font-semibold text-ink/60">Booking link<input name="booking_url" type="url" defaultValue={v.booking_url ?? ""} className={field} /></label>
              <label className="text-xs font-semibold text-ink/60">Your name (our contact)<input name="contact_name" defaultValue={v.contact_name ?? ""} className={field} /></label>
              <label className="text-xs font-semibold text-ink/60">Your WhatsApp (our contact)<input name="contact_whatsapp" type="tel" defaultValue={v.contact_whatsapp ?? ""} className={field} /></label>
            </fieldset>
            <button className="rounded-xl bg-ink px-4 py-3 text-lg font-bold text-oat">Save changes</button>
            <p className="text-xs text-ink/55">Saving also counts as confirming. Changes to prices and tickets go live straight away; other edits may be checked by us first. Photos and descriptions: send them to post@ziggadoo.com for now.</p>
          </form>
        </>
      )}
    </main>
  );
}
