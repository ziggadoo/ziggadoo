"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser(slug: string, hash: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/v/${slug}#${hash}`)}`);
  return { supabase, user };
}

const str = (fd: FormData, k: string) => { const v = String(fd.get(k) ?? "").trim(); return v || null; };
const tri = (fd: FormData, k: string) => { const v = fd.get(k); return v === "yes" ? true : v === "no" ? false : null; };

export async function submitReview(fd: FormData) {
  const slug = String(fd.get("slug"));
  const { supabase, user } = await requireUser(slug, "review");
  const venueId = String(fd.get("venue_id"));
  const ages = String(fd.get("loved_ages") ?? "").split(/[,\s]+/).map(Number).filter((y) => Number.isFinite(y) && y >= 0 && y <= 18).map((y) => Math.round(y * 12));
  const rating = Number(fd.get("rating"));
  if (!(rating >= 1 && rating <= 5)) redirect(`/v/${slug}?msg=rating#review`);
  const valueScore = Number(fd.get("value_score")) || null;
  const goodValue = valueScore == null ? null : valueScore >= 4 ? true : valueScore <= 2 ? false : null;
  const vm = Number(fd.get("visited_month")), vy = Number(fd.get("visited_year"));
  const visitedOn = vm >= 1 && vm <= 12 && vy >= 2000 ? `${vy}-${String(vm).padStart(2, "0")}-01` : null;
  const displayName = str(fd, "display_name");
  if (displayName) await supabase.from("profiles").update({ display_name: displayName.slice(0, 40) }).eq("id", user.id);
  const row = {
    venue_id: venueId, profile_id: user.id, rating, value_score: valueScore, visited_on: visitedOn,
    would_return: tri(fd, "would_return"), good_value: goodValue, good_for_party: tri(fd, "good_for_party"),
    party_note: str(fd, "party_note"), child_ages_months: ages, loved_it_ages_months: ages,
    duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : null, body: str(fd, "body"), status: "pending" as const,
  };
  const { data: saved, error } = await supabase.from("reviews").upsert(row, { onConflict: "venue_id,profile_id" }).select("id").single();
  const note = str(fd, "admin_note");
  if (!error && saved && note) await supabase.from("review_notes").upsert({ review_id: saved.id, profile_id: user.id, note }, { onConflict: "review_id" });
  revalidatePath(`/v/${slug}`);
  redirect(`/v/${slug}?msg=${error ? encodeURIComponent(error.message) : "review-ok"}#review`);
}

export async function submitReport(fd: FormData) {
  const slug = String(fd.get("slug"));
  const { supabase, user } = await requireUser(slug, "report");
  const { error } = await supabase.from("reports").insert({ venue_id: String(fd.get("venue_id")), profile_id: user.id, kind: String(fd.get("kind")), note: str(fd, "note") });
  redirect(`/v/${slug}?msg=${error ? encodeURIComponent(error.message) : "report-ok"}#report`);
}

export async function toggleSaved(fd: FormData) {
  const slug = String(fd.get("slug"));
  const { supabase, user } = await requireUser(slug, "top");
  const venueId = String(fd.get("venue_id")); const kind = fd.get("kind") === "been" ? "been" : "saved"; const on = fd.get("on") === "1";
  if (on) await supabase.from("saved_venues").upsert({ profile_id: user.id, venue_id: venueId, kind });
  else await supabase.from("saved_venues").delete().match({ profile_id: user.id, venue_id: venueId, kind });
  const back = String(fd.get("back") || `/v/${slug}`);
  revalidatePath(back); revalidatePath("/saved");
  redirect(back);
}

export async function submitClaim(fd: FormData) {
  const slug = String(fd.get("slug"));
  const { supabase, user } = await requireUser(slug, "claim");
  const evidence = [str(fd, "role"), str(fd, "evidence"), fd.get("photo_consent") ? "Photo consent: yes" : "Photo consent: no"].filter(Boolean).join(" | ");
  const { error } = await supabase.from("venue_claims").insert({ venue_id: String(fd.get("venue_id")), profile_id: user.id, business_email: str(fd, "business_email"), evidence });
  redirect(`/v/${slug}?msg=${error ? encodeURIComponent(error.message) : "claim-ok"}#claim`);
}
