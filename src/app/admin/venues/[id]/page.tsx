import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveVenue } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit venue", robots: { index: false } };

const field = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-cobalt";
const F = ({ name, label, value, type = "text" }: { name: string; label: string; value: unknown; type?: string }) => (
  <label className="text-xs font-semibold text-ink/60">{label}<input name={name} type={type} defaultValue={value == null ? "" : String(value)} className={field + " mt-1"} /></label>
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

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      <div className="flex justify-between text-sm font-bold text-cobalt"><Link href="/admin">← Admin</Link><Link href={`/v/${v.slug}`}>View listing →</Link></div>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{v.name}</h1>
      {msg && <p className={`mt-2 text-sm ${msg === "saved" ? "text-cobalt" : "text-persimmon"}`}>{msg === "saved" ? "Saved." : msg}</p>}
      {v.confidence_notes && <p className="mt-2 rounded-xl bg-sun/30 p-2 text-xs">Research notes: {v.confidence_notes}</p>}
      <form action={saveVenue} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={v.id} />
        <div className="sm:col-span-2"><F name="name" label="Name" value={v.name} /></div>
        <div className="sm:col-span-2"><F name="tagline" label="Tagline" value={v.tagline} /></div>
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Description<textarea name="description" rows={3} defaultValue={v.description ?? ""} className={field + " mt-1"} /></label>
        <F name="area" label="Area" value={v.area} /><F name="address" label="Address" value={v.address} />
        <label className="text-xs font-semibold text-ink/60">Indoor/outdoor<select name="indoor_outdoor" defaultValue={v.indoor_outdoor} className={field + " mt-1"}><option value="indoor">indoor</option><option value="outdoor">outdoor</option><option value="mixed">mixed</option></select></label>
        <label className="text-xs font-semibold text-ink/60">Status<select name="status" defaultValue={v.status} className={field + " mt-1"}><option value="draft">draft</option><option value="needs_review">needs_review</option><option value="verified">verified</option><option value="archived">archived</option></select></label>
        <div className="sm:col-span-2"><F name="categories" label="Categories (comma separated; add homeschool for the home-schooler filter)" value={(v.categories ?? []).join(", ")} /></div>
        <div className="sm:col-span-2"><F name="aliases" label="Other names (separate with |)" value={(v.aliases ?? []).join(" | ")} /></div>
        <F name="age_min_months" label="Age min (months)" value={v.age_min_months} type="number" /><F name="age_max_months" label="Age max (months)" value={v.age_max_months} type="number" />
        <F name="best_age_min_months" label="Best from (months)" value={v.best_age_min_months} type="number" /><F name="best_age_max_months" label="Best to (months)" value={v.best_age_max_months} type="number" />
        <div className="sm:col-span-2"><F name="height_note" label="Height / age tip shown on listing" value={v.height_note} /></div>
        <label className="text-xs font-semibold text-ink/60">Price model<select name="price_model" defaultValue={v.price_model} className={field + " mt-1"}>{["free","per_child","per_person","per_family","from","unknown"].map((o) => <option key={o} value={o}>{o}</option>)}</select></label>
        <label className="text-xs font-semibold text-ink/60">Adults free?<select name="adult_entry_free" defaultValue={v.adult_entry_free == null ? "" : String(v.adult_entry_free)} className={field + " mt-1"}><option value="">unknown</option><option value="true">yes</option><option value="false">no</option></select></label>
        <F name="price_child_aed" label="Child price AED" value={v.price_child_aed} type="number" /><F name="price_adult_aed" label="Adult price AED" value={v.price_adult_aed} type="number" />
        <F name="free_under_months" label="Free under (months)" value={v.free_under_months} type="number" /><F name="typical_duration_min" label="Typical visit (min)" value={v.typical_duration_min} type="number" />
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Price notes<textarea name="price_notes" rows={2} defaultValue={v.price_notes ?? ""} className={field + " mt-1"} /></label>
        <label className="text-xs font-semibold text-ink/60">Booking<select name="booking" defaultValue={v.booking} className={field + " mt-1"}><option value="walk_in">walk_in</option><option value="recommended">recommended</option><option value="required">required</option></select></label>
        <F name="booking_url" label="Booking URL" value={v.booking_url} />
        <F name="whatsapp" label="WhatsApp (+971...)" value={v.whatsapp} /><F name="phone" label="Phone" value={v.phone} />
        <F name="website" label="Website" value={v.website} /><F name="instagram" label="Instagram handle" value={v.instagram} />
        <div className="sm:col-span-2"><F name="hero_image_url" label="Main image URL (leave blank for illustration)" value={v.hero_image_url} /></div>
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Opening hours JSON ({`{"mon":"10:00-22:00",...}`} or {`{"note":"..."}`})<textarea name="opening_hours" rows={2} defaultValue={JSON.stringify(v.opening_hours)} className={field + " mt-1 font-mono text-xs"} /></label>
        <label className="text-xs font-semibold text-ink/60 sm:col-span-2">Seasonal notes<textarea name="seasonal_notes" rows={2} defaultValue={v.seasonal_notes ?? ""} className={field + " mt-1"} /></label>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="mark_verified" value="1" /> Mark as verified by me today (gives the freshness boost and removes the AI-research label)</label>
        <button className="rounded-xl bg-ink px-4 py-2.5 font-bold text-oat sm:col-span-2">Save</button>
      </form>
    </main>
  );
}
