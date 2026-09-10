"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { toVenuePatch, type SubmittedPhoto } from "@/lib/venueForm";
import { FACILITIES, GOOD_FOR_KEYS } from "@/lib/goodfor";

async function admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (p?.role !== "admin") redirect("/");
  return { supabase, user };
}

const TABLES = { review: "reviews", photo: "venue_photos", claim: "venue_claims", suggestion: "venue_suggestions", report: "reports" } as const;

export async function moderate(boundDecision: string, fd: FormData) {
  const { supabase, user } = await admin();
  const kind = String(fd.get("kind")) as keyof typeof TABLES;
  const id = String(fd.get("id"));
  // The decision is bound to each button (formAction) rather than read from the submitter,
  // because iOS Safari does not always include the submit button's name/value in FormData.
  const decision = boundDecision || String(fd.get("decision") ?? "");
  const table = TABLES[kind];
  const back = String(fd.get("back") ?? "/admin");
  // Never guess: an empty or unknown decision (can happen if the form submits before hydration) does nothing.
  if (!table || !["approve", "reject", "delete"].includes(decision)) { redirect(back + "?msg=nodecision"); }
  if (decision === "delete") {
    await supabase.from(table).delete().eq("id", id);
    revalidatePath(back); redirect(back);
  }
  if (kind === "report") {
    await supabase.from("reports").update({ status: decision === "approve" ? "resolved" : "dismissed", resolved_at: new Date().toISOString(), resolved_by: user.id }).eq("id", id);
  } else {
    const { error } = await supabase.from(table).update({ status: decision === "approve" ? "approved" : "rejected" }).eq("id", id);
    if (error) redirect(back + "?msg=" + encodeURIComponent(error.message));
  }
  if (kind === "claim" && decision === "approve") {
    const { data: c } = await supabase.from("venue_claims").select("venue_id, profile_id").eq("id", id).maybeSingle();
    if (c) {
      await supabase.from("venues").update({ claimed_by: c.profile_id }).eq("id", c.venue_id);
      await supabase.from("profiles").update({ role: "business" }).eq("id", c.profile_id).neq("role", "admin");
    }
  }
  revalidatePath(back);
  redirect(back);
}

const NUM = ["price_child_aed", "price_adult_aed", "age_min_months", "age_max_months", "best_age_min_months", "best_age_max_months", "free_under_months", "typical_duration_min"];
const TEXT = ["name", "tagline", "description", "area", "address", "price_model", "price_notes", "height_note", "booking", "booking_url", "whatsapp", "phone", "website", "instagram", "seasonal_notes", "hero_image_url", "status", "indoor_outdoor"];

export async function saveVenue(fd: FormData) {
  const { supabase, user } = await admin();
  const id = String(fd.get("id"));
  const patch: Record<string, unknown> = {};
  for (const k of TEXT) { const v = String(fd.get(k) ?? "").trim(); patch[k] = v || null; }
  for (const k of NUM) { const v = String(fd.get(k) ?? "").trim(); patch[k] = v ? Number(v) : null; }
  patch.adult_entry_free = fd.get("adult_entry_free") === "true" ? true : fd.get("adult_entry_free") === "false" ? false : null;
  const cats = String(fd.get("categories") ?? "").split(/[,\s]+/).filter(Boolean).filter((c) => !GOOD_FOR_KEYS.includes(c));
  for (const k of GOOD_FOR_KEYS) if (fd.get("gf_" + k)) cats.push(k);
  patch.categories = Array.from(new Set(cats));
  if (typeof patch.tagline === "string") patch.tagline = patch.tagline.slice(0, 60);
  const facilities: Record<string, boolean> = {};
  for (const f of FACILITIES) if (fd.get("fac_" + f.key)) facilities[f.key] = true;
  patch.facilities = facilities;
  patch.prices_ok = !!fd.get("prices_ok");
  const pnum = (k: string) => { const v = String(fd.get(k) ?? "").trim(); return v ? Number(v) : null; };
  const ptxt = (k: string) => String(fd.get(k) ?? "").trim() || null;
  patch.party = fd.get("party_hosts") ? {
    hosts: true, starter_price: pnum("party_starter_price"), includes: ptxt("party_includes"), duration: ptxt("party_duration"), min_kids: pnum("party_min_kids"), max_kids: pnum("party_max_kids"),
    extra_child: pnum("party_extra_child"), food: ptxt("party_food"), cake: ptxt("party_cake"), theme: ptxt("party_theme"), addons: ptxt("party_addons"), lead_time: ptxt("party_lead_time"), whatsapp: ptxt("party_whatsapp"), prices_ok: !!fd.get("party_prices_ok"),
  } : { hosts: false };
  patch.contact_name = ptxt("contact_name"); patch.contact_email = ptxt("contact_email")?.toLowerCase() ?? null; patch.contact_whatsapp = ptxt("contact_whatsapp");
  patch.passes_enabled = !!fd.get("passes_enabled");
  patch.needs_call = !!fd.get("needs_call");
  if (fd.get("mark_confirmed")) { patch.prices_confirmed_at = new Date().toISOString(); patch.nudge_count = 0; patch.needs_call = false; }
  const lat = Number(fd.get("latitude")), lng = Number(fd.get("longitude"));
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) patch.geom = `SRID=4326;POINT(${lng} ${lat})`;
  patch.aliases = String(fd.get("aliases") ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  try { patch.opening_hours = JSON.parse(String(fd.get("opening_hours") || "{}")); } catch { /* keep existing */ delete patch.opening_hours; }
  if (fd.get("mark_verified")) { patch.last_verified_at = new Date().toISOString(); patch.verified_by = user.id; patch.source = "admin"; }
  const { error } = await supabase.from("venues").update(patch).eq("id", id);
  revalidatePath(`/admin/venues/${id}`);
  redirect(`/admin/venues/${id}?msg=${error ? encodeURIComponent(error.message) : "saved"}`);
}

export async function approveSubmission(id: string) {
  const { supabase, user } = await admin();
  const { data: sub } = await supabase.from("venue_submissions").select("*").eq("id", id).maybeSingle();
  if (!sub) redirect("/admin?msg=" + encodeURIComponent("Submission not found"));
  const photos = (sub.photos ?? []) as SubmittedPhoto[];
  const patch = toVenuePatch(sub.data as Record<string, string>, photos);
  let slug = slugify(patch.name);
  const { data: clash } = await supabase.from("venues").select("id").eq("slug", slug).maybeSingle();
  if (clash) slug = `${slug}-${id.slice(0, 4)}`;
  // Draft venues need a pin; Dubai centre until you set the real one on the edit page.
  const { data: venue, error } = await supabase.from("venues").insert({ ...patch, slug, geom: "SRID=4326;POINT(55.2708 25.2048)", area: "Dubai", verified_by: user.id }).select("id").single();
  if (error || !venue) redirect("/admin?msg=" + encodeURIComponent(error?.message ?? "Could not create venue"));
  if (photos.length) await supabase.from("venue_photos").insert(photos.map((p, i) => ({ venue_id: venue.id, storage_path: p.url, caption: p.caption || null, is_community: false, status: "approved", sort_order: i + 1 })));
  await supabase.from("venue_submissions").update({ status: "approved", venue_id: venue.id }).eq("id", id);
  revalidatePath("/admin");
  redirect(`/admin/venues/${venue.id}?msg=fromsubmission`);
}

export async function rejectSubmission(id: string) {
  const { supabase } = await admin();
  await supabase.from("venue_submissions").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/admin"); redirect("/admin");
}

export async function closeEnquiry(id: string) {
  const { supabase } = await admin();
  await supabase.from("venue_enquiries").update({ status: "done" }).eq("id", id);
  revalidatePath("/admin"); redirect("/admin");
}

export async function saveTickets(fd: FormData) {
  const { supabase } = await admin();
  const id = String(fd.get("id"));
  const s = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const n = (k: string) => { const v = String(fd.get(k) ?? "").trim(); return v && Number.isFinite(Number(v)) ? Number(v) : null; };
  for (let i = 0; i < 20; i++) {
    const name = s(`tt_${i}_name`); const tid = s(`tt_${i}_id`);
    if (!name && !tid) continue;
    const row = { name: name ?? "", description: s(`tt_${i}_description`), price_aed: n(`tt_${i}_price`), ziggadoo_price_aed: n(`tt_${i}_zprice`), sort_order: i, updated_at: new Date().toISOString() };
    if (tid) {
      if (fd.get(`tt_${i}_remove`) || !name) await supabase.from("ticket_types").update({ active: false }).eq("id", tid);
      else await supabase.from("ticket_types").update({ ...row, active: true }).eq("id", tid);
    } else if (name) await supabase.from("ticket_types").insert({ ...row, venue_id: id });
  }
  revalidatePath(`/admin/venues/${id}`); revalidatePath(`/v/*`);
  redirect(`/admin/venues/${id}?msg=saved#tickets`);
}

export async function callDone(id: string) {
  const { supabase } = await admin();
  await supabase.from("venues").update({ needs_call: false, nudge_count: 0, prices_confirmed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin"); redirect("/admin");
}

export async function closePassReport(id: string) {
  const { supabase } = await admin();
  await supabase.from("pass_reports").delete().eq("id", id);
  revalidatePath("/admin"); redirect("/admin");
}
