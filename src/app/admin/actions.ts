"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (p?.role !== "admin") redirect("/");
  return { supabase, user };
}

const TABLES = { review: "reviews", photo: "venue_photos", claim: "venue_claims", suggestion: "venue_suggestions", report: "reports" } as const;

export async function moderate(fd: FormData) {
  const { supabase, user } = await admin();
  const kind = String(fd.get("kind")) as keyof typeof TABLES;
  const id = String(fd.get("id"));
  const decision = String(fd.get("decision"));
  const table = TABLES[kind];
  if (!table) return;
  if (kind === "report") {
    await supabase.from("reports").update({ status: decision === "approve" ? "resolved" : "dismissed", resolved_at: new Date().toISOString(), resolved_by: user.id }).eq("id", id);
  } else {
    await supabase.from(table).update({ status: decision === "approve" ? "approved" : "rejected" }).eq("id", id);
  }
  if (kind === "claim" && decision === "approve") {
    const { data: c } = await supabase.from("venue_claims").select("venue_id, profile_id").eq("id", id).maybeSingle();
    if (c) {
      await supabase.from("venues").update({ claimed_by: c.profile_id }).eq("id", c.venue_id);
      await supabase.from("profiles").update({ role: "business" }).eq("id", c.profile_id).neq("role", "admin");
    }
  }
  revalidatePath("/admin");
  redirect("/admin");
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
  patch.categories = String(fd.get("categories") ?? "").split(/[,\s]+/).filter(Boolean);
  patch.aliases = String(fd.get("aliases") ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  try { patch.opening_hours = JSON.parse(String(fd.get("opening_hours") || "{}")); } catch { /* keep existing */ delete patch.opening_hours; }
  if (fd.get("mark_verified")) { patch.last_verified_at = new Date().toISOString(); patch.verified_by = user.id; patch.source = "admin"; }
  const { error } = await supabase.from("venues").update(patch).eq("id", id);
  revalidatePath(`/admin/venues/${id}`);
  redirect(`/admin/venues/${id}?msg=${error ? encodeURIComponent(error.message) : "saved"}`);
}
