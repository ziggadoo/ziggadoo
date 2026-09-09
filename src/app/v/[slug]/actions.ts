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
  const row = {
    venue_id: venueId, profile_id: user.id, rating,
    would_return: tri(fd, "would_return"), good_value: tri(fd, "good_value"), good_for_party: tri(fd, "good_for_party"),
    party_note: str(fd, "party_note"), child_ages_months: ages, loved_it_ages_months: ages,
    duration_min: fd.get("duration_min") ? Number(fd.get("duration_min")) : null, body: str(fd, "body"), status: "pending" as const,
  };
  const { error } = await supabase.from("reviews").upsert(row, { onConflict: "venue_id,profile_id" });
  revalidatePath(`/v/${slug}`);
  redirect(`/v/${slug}?msg=${error ? encodeURIComponent(error.message) : "review-ok"}#review`);
}

export async function submitReport(fd: FormData) {
  const slug = String(fd.get("slug"));
  const { supabase, user } = await requireUser(slug, "report");
  const { error } = await supabase.from("reports").insert({ venue_id: String(fd.get("venue_id")), profile_id: user.id, kind: String(fd.get("kind")), note: str(fd, "note") });
  redirect(`/v/${slug}?msg=${error ? encodeURIComponent(error.message) : "report-ok"}#report`);
}

export async function submitClaim(fd: FormData) {
  const slug = String(fd.get("slug"));
  const { supabase, user } = await requireUser(slug, "claim");
  const evidence = [str(fd, "role"), str(fd, "evidence"), fd.get("photo_consent") ? "Photo consent: yes" : "Photo consent: no"].filter(Boolean).join(" | ");
  const { error } = await supabase.from("venue_claims").insert({ venue_id: String(fd.get("venue_id")), profile_id: user.id, business_email: str(fd, "business_email"), evidence });
  redirect(`/v/${slug}?msg=${error ? encodeURIComponent(error.message) : "claim-ok"}#claim`);
}
