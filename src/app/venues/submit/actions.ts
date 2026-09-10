"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { ALL_FIELDS, PHOTO_MIN, SECTIONS, TAGLINE_MAX, type SubmittedPhoto } from "@/lib/venueForm";

const SUBMISSIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/venue-submissions/";

export async function submitVenue(fd: FormData) {
  if (String(fd.get("company_website") ?? "")) redirect("/venues/submit?msg=ok"); // honeypot
  const d: Record<string, string> = {};
  for (const f of ALL_FIELDS) {
    const v = String(fd.get(f.key) ?? "").trim();
    if (v) d[f.key] = f.maxLength ? v.slice(0, f.maxLength) : v;
  }
  if (!d.venue_name || !d.contact_name || !d.contact_whatsapp || !d.contact_email) redirect("/venues/submit?msg=missing");
  if (d.tagline) d.tagline = d.tagline.slice(0, TAGLINE_MAX);

  let photos: SubmittedPhoto[] = [];
  try {
    const raw = JSON.parse(String(fd.get("photos") || "[]"));
    if (Array.isArray(raw)) photos = raw.filter((p) => typeof p?.url === "string" && p.url.startsWith(SUBMISSIONS_URL)).map((p) => ({ url: p.url, caption: String(p.caption ?? "").slice(0, 120) }));
  } catch { photos = []; }
  if (photos.length < PHOTO_MIN) redirect("/venues/submit?msg=photos");
  if (!fd.get("photo_licence") || !fd.get("accurate")) redirect("/venues/submit?msg=consent");

  const supabase = await createClient();
  const { error } = await supabase.from("venue_submissions").insert({
    venue_name: d.venue_name, contact_name: d.contact_name, contact_whatsapp: d.contact_whatsapp, contact_email: d.contact_email, data: d, photos,
  });
  if (error) redirect("/venues/submit?msg=" + encodeURIComponent(error.message));

  const lines: string[] = [`New venue submission: ${d.venue_name}`, ""];
  for (const s of SECTIONS) {
    const rows = s.fields.filter((f) => d[f.key]).map((f) => `${f.label}: ${d[f.key]}`);
    if (rows.length) lines.push(`## ${s.title}`, ...rows, "");
  }
  lines.push(`## Photos (${photos.length})`, ...photos.map((p, i) => `${i + 1}. ${p.url}${p.caption ? ` (${p.caption})` : ""}`), "", "Review and approve it at https://ziggadoo.com/admin");
  await sendEmail({ subject: "New Venue Submission Form", text: lines.join("\n"), replyTo: d.contact_email });
  redirect("/venues/submit?msg=ok");
}
