import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { moderate, saveVenue, saveTickets } from "../../actions";
import { FACILITIES, GOOD_FOR } from "@/lib/goodfor";
import { TAGLINE_MAX } from "@/lib/venueForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit venue", robots: { index: false } };

const field = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-cobalt";
const F = ({ name, label, value, type = "text", maxLength }: { name: string; label: string; value: unknown; type?: string; maxLength?: number }) => (
  <label className="text-xs font-semibold text-ink/60">{label}<input name={name} type={type} maxLength={maxLength} defaultValue={value == null ? "" : String(value)} className={field + " mt-1"} /></label>
);
const C = ({ name, label, checked }: { name: string; label: string; checked: boolean }) => (
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} value="1" defaultChecked={checked} className="h-4 w-4" /> {label}</label>
);

export default async function EditVenue({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params; const { msg } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") redirect("/");
  const { data: v } = await supabase.from("venues").select("*").eq("id", id).maybeSingle();
  if (!v) notFound();
  const [{ data: reviews }, { data: photos }, { data: tickets }, { data: ll }] = await Promise.all([
    supabase.from("reviews").select("id, rating, body, status, created_at, profiles(display_name)").eq("venue_id", id).order("created_at", { ascending: false }),
    supabase.from("venue_photos").select("id, storage_path, caption, status, is_community").eq("venue_id", id).order("sort_order"),
    supabase.from("ticket_types").select("id, name, description, price_aed, ziggadoo_price_aed").eq("venue_id", id).eq("active", true).order("sort_order"),
    supabase.rpc("venue_latlng", { vid: id }).maybeSingle() as unknown as Promise<{ data: { lat: number; lng: number } | null }>,
  ]);
  const cats: string[] = v.categories ?? [];
  const gfKeys = GOOD_FOR.map((g) => g.key as string);
  const fac = (v.facilities ?? {}) as Record<string, boolean>;
  const party = (v.party ?? {}) as Record<string, unknown>;
  const pv = (k: string) => (party[k] == null ? "" : String(party[k]));
  const Mod = ({ kind, itemId, status }: { kind: string; itemId: string; status: string }) => (
    <form className="flex items-center gap-2 text-xs">
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={itemId} /><input type="hidden" name="back" value={`/admin/venues/${id}`} />
      <span className={`rounded-full px-2 py-0.5 font-bold ${status === "approved" ? "bg-pool/40" : status === "rejected" ? "bg-ink/10" : "bg-sun/40"}`}>{status}</span>
      {status !== "approved" && <button type="submit" formAction={moderate.bind(null, "approve")} className="font-bold text-cobalt">Approve</button>}
      {status !== "rejected" && <button type="submit" formAction={moderate.bind(null, "reject")} className="font-bold">Reject</button>}
      <button type="submit" formAction={moderate.bind(null, "delete")} className="font-bold text-persimmon">Delete</button>
    </form>
  );

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <div className="flex justify-between text-sm font-bold text-cobalt"><Link href="/admin">← Admin</Link><Link href={`/v/${v.slug}`}>View listing →</Link></div>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{v.name}</h1>
      {msg && <p className={`mt-2 text-sm ${msg === "saved" ? "text-cobalt" : "text-persimmon"}`}>{msg === "saved" ? "Saved." : msg === "fromsubmission" ? "Draft created from the venue's submission. Set ages in months, the map pin and the area, then switch status to verified." : msg}</p>}
      {v.confidence_notes && <p className="mt-2 rounded-xl bg-sun/30 p-2 text-xs">Research notes: {v.confidence_notes}</p>}
      <form action={saveVenue} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={v.id} />
        <div className="sm:col-span-2"><F name="name" label="Name" value={v.name} /></div>
        <div className="sm:col-span-2"><F name="tagline" label={`One line on what kids do here (max ${TAGLINE_MAX} characters)`} value={v.tagline} maxLength={TAGLINE_MAX} /></div>
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Description<textarea name="description" rows={3} defaultValue={v.description ?? ""} className={field + " mt-1"} /></label>
        <F name="area" label="Area" value={v.area} /><F name="address" label="Address" value={v.address} />
        <F name="latitude" label="Latitude (map pin)" value={ll?.lat} type="number" /><F name="longitude" label="Longitude" value={ll?.lng} type="number" />
        <label className="text-xs font-semibold text-ink/60">Indoor/outdoor<select name="indoor_outdoor" defaultValue={v.indoor_outdoor} className={field + " mt-1"}><option value="indoor">indoor</option><option value="outdoor">outdoor</option><option value="mixed">mixed</option></select></label>
        <label className="text-xs font-semibold text-ink/60">Status<select name="status" defaultValue={v.status} className={field + " mt-1"}><option value="draft">draft</option><option value="needs_review">needs_review</option><option value="verified">verified</option><option value="archived">archived</option></select></label>
        <div className="sm:col-span-2"><F name="categories" label="Categories (comma separated)" value={cats.filter((c) => !gfKeys.includes(c)).join(", ")} /></div>
        <fieldset className="grid gap-1 rounded-2xl bg-white p-3 ring-1 ring-ink/10 sm:col-span-2"><legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink/50">Good for</legend>{GOOD_FOR.map((g) => <C key={g.key} name={"gf_" + g.key} label={g.label} checked={cats.includes(g.key)} />)}</fieldset>
        <fieldset className="grid gap-1 rounded-2xl bg-white p-3 ring-1 ring-ink/10 sm:col-span-2 sm:grid-cols-2"><legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink/50">Facilities</legend>{FACILITIES.map((f) => <C key={f.key} name={"fac_" + f.key} label={f.label} checked={!!fac[f.key]} />)}</fieldset>
        <div className="sm:col-span-2"><F name="aliases" label="Other names (separate with |)" value={(v.aliases ?? []).join(" | ")} /></div>
        <F name="age_min_months" label="Age min (months)" value={v.age_min_months} type="number" /><F name="age_max_months" label="Age max (months)" value={v.age_max_months} type="number" />
        <F name="best_age_min_months" label="Best from (months)" value={v.best_age_min_months} type="number" /><F name="best_age_max_months" label="Best to (months)" value={v.best_age_max_months} type="number" />
        <div className="sm:col-span-2"><F name="height_note" label="Height / age tip shown on listing" value={v.height_note} /></div>
        <label className="text-xs font-semibold text-ink/60">Price model<select name="price_model" defaultValue={v.price_model} className={field + " mt-1"}>{["free","per_child","per_person","per_family","from","unknown"].map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
        <label className="text-xs font-semibold text-ink/60">Adults free?<select name="adult_entry_free" defaultValue={v.adult_entry_free == null ? "" : String(v.adult_entry_free)} className={field + " mt-1"}><option value="">unknown</option><option value="true">yes</option><option value="false">no</option></select></label>
        <F name="price_child_aed" label="Child price AED" value={v.price_child_aed} type="number" /><F name="price_adult_aed" label="Adult price AED" value={v.price_adult_aed} type="number" />
        <F name="free_under_months" label="Free under (months)" value={v.free_under_months} type="number" /><F name="typical_duration_min" label="Typical visit (min)" value={v.typical_duration_min} type="number" />
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Price notes<textarea name="price_notes" rows={2} defaultValue={v.price_notes ?? ""} className={field + " mt-1"} /></label>
        <div className="sm:col-span-2"><C name="prices_ok" label="Venue has agreed to us publishing these prices" checked={!!v.prices_ok} /></div>
        <label className="text-xs font-semibold text-ink/60">Booking<select name="booking" defaultValue={v.booking} className={field + " mt-1"}><option value="walk_in">walk_in</option><option value="recommended">recommended</option><option value="required">required</option></select></label>
        <F name="booking_url" label="Booking URL" value={v.booking_url} />
        <F name="whatsapp" label="WhatsApp (+971...)" value={v.whatsapp} /><F name="phone" label="Phone" value={v.phone} />
        <F name="website" label="Website" value={v.website} /><F name="instagram" label="Instagram handle" value={v.instagram} />
        <div className="sm:col-span-2"><F name="hero_image_url" label="Main image URL (leave blank for illustration)" value={v.hero_image_url} /></div>
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Opening hours JSON ({`{"mon":"10:00-22:00",...}`} or {`{"note":"..."}`})<textarea name="opening_hours" rows={2} defaultValue={JSON.stringify(v.opening_hours)} className={field + " mt-1 font-mono text-xs"} /></label>
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Seasonal notes<textarea name="seasonal_notes" rows={2} defaultValue={v.seasonal_notes ?? ""} className={field + " mt-1"} /></label>
        <fieldset className="grid gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink/50">Venue contact and self-service</legend>
          <F name="contact_name" label="Contact name" value={v.contact_name} /><F name="contact_whatsapp" label="Contact WhatsApp" value={v.contact_whatsapp} />
          <div className="sm:col-span-2"><F name="contact_email" label="Contact email (used for the monthly confirmation email and the venue's edit link)" value={v.contact_email} type="email" /></div>
          <p className="text-xs text-ink/60 sm:col-span-2">Confirmed by venue: {v.prices_confirmed_at ? new Date(v.prices_confirmed_at).toLocaleDateString("en-GB") : "never"} · reminders sent: {v.nudge_count ?? 0}{v.needs_call ? " · ON CALL LIST" : ""}</p>
          <C name="mark_confirmed" label="I confirmed the details with the venue today (by phone or WhatsApp)" checked={false} />
          <C name="needs_call" label="Needs a call" checked={!!v.needs_call} />
          <div className="sm:col-span-2"><C name="passes_enabled" label="Ziggadoo passes live for this venue (only after the front desk knows what a pass is)" checked={!!v.passes_enabled} /></div>
        </fieldset>
        <fieldset className="grid gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-ink/50">Birthday parties</legend>
          <div className="sm:col-span-2"><C name="party_hosts" label="Hosts birthday parties" checked={party.hosts === true} /></div>
          <F name="party_starter_price" label="Starter package for 10 kids, AED" value={pv("starter_price")} type="number" /><F name="party_duration" label="Total party length" value={pv("duration")} />
          <label className="text-xs font-semibold text-ink/60 sm:col-span-2">What the starter package includes<textarea name="party_includes" rows={2} defaultValue={pv("includes")} className={field + " mt-1"} /></label>
          <F name="party_min_kids" label="Min kids" value={pv("min_kids")} type="number" /><F name="party_max_kids" label="Max kids" value={pv("max_kids")} type="number" />
          <F name="party_extra_child" label="Extra child, AED" value={pv("extra_child")} type="number" /><F name="party_food" label="Food and drink options" value={pv("food")} />
          <F name="party_cake" label="Cake (bring / buy / either)" value={pv("cake")} /><F name="party_theme" label="Theme add-on and price" value={pv("theme")} />
          <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Other add-ons<textarea name="party_addons" rows={2} defaultValue={pv("addons")} className={field + " mt-1"} /></label>
          <F name="party_lead_time" label="Book how far ahead" value={pv("lead_time")} /><F name="party_whatsapp" label="Party WhatsApp" value={pv("whatsapp")} />
          <div className="sm:col-span-2"><C name="party_prices_ok" label="Venue has agreed to us publishing the package and price" checked={party.prices_ok === true} /></div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="mark_verified" value="1" /> Mark as verified by me today (gives the freshness boost and removes the AI-research label)</label>
        <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat sm:col-span-2">Save</button>
      </form>

      <h2 id="tickets" className="mt-8 text-sm font-bold uppercase tracking-wide text-ink/50">Tickets ({tickets?.length ?? 0})</h2>
      <p className="mt-1 text-xs text-ink/60">Separate save button. List price is the door price; Ziggadoo price is what a pass gets. Blank Ziggadoo price = no pass for that ticket.</p>
      <form action={saveTickets} className="mt-2 grid gap-2">
        <input type="hidden" name="id" value={v.id} />
        {[...(tickets ?? []), null, null, null].map((tk, i) => (
          <div key={tk?.id ?? `new-${i}`} className="grid gap-2 rounded-2xl bg-white p-3 text-sm ring-1 ring-ink/10 sm:grid-cols-6">
            {tk && <input type="hidden" name={`tt_${i}_id`} value={tk.id} />}
            <div className="sm:col-span-2"><F name={`tt_${i}_name`} label="Ticket" value={tk?.name} /></div>
            <div className="sm:col-span-2"><F name={`tt_${i}_description`} label="Included" value={tk?.description} /></div>
            <F name={`tt_${i}_price`} label="List AED" value={tk?.price_aed} type="number" /><F name={`tt_${i}_zprice`} label="Ziggadoo AED" value={tk?.ziggadoo_price_aed} type="number" />
            {tk && <div className="sm:col-span-6"><C name={`tt_${i}_remove`} label="Remove" checked={false} /></div>}
          </div>
        ))}
        <button className="rounded-xl bg-ink px-4 py-2 font-bold text-oat">Save tickets</button>
      </form>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-ink/50">Reviews ({reviews?.length ?? 0})</h2>
      <ul className="mt-2 grid gap-2">
        {reviews?.map((r) => (
          <li key={r.id} className="rounded-2xl bg-white p-3 text-sm ring-1 ring-ink/10">
            <div className="flex justify-between"><span>{"★".repeat(r.rating)} · {(r.profiles as unknown as { display_name: string | null } | null)?.display_name ?? "?"}</span><span className="text-xs text-ink/50">{new Date(r.created_at).toLocaleDateString("en-GB")}</span></div>
            {r.body && <p className="mt-1">{r.body}</p>}
            <div className="mt-2"><Mod kind="review" itemId={r.id} status={r.status} /></div>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink/50">Photos ({photos?.length ?? 0})</h2>
      <ul className="mt-2 grid gap-2">
        {photos?.map((p) => (
          <li key={p.id} className="flex gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.storage_path} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><p className="text-xs text-ink/70">{p.caption}{p.is_community ? " · parent upload" : ""}</p><div className="mt-2"><Mod kind="photo" itemId={p.id} status={p.status} /></div></div>
          </li>
        ))}
      </ul>
    </main>
  );
}
