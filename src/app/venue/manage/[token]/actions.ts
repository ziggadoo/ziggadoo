"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { TAGLINE_MAX } from "@/lib/venueForm";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

async function venueFor(token: string) {
  const db = adminClient();
  const { data: t } = await db.from("venue_manage_tokens").select("venue_id, expires_at").eq("token", token).maybeSingle();
  if (!t || new Date(t.expires_at) < new Date()) redirect("/venue/manage?msg=expired");
  return { db, venueId: t.venue_id as string };
}

export async function saveSelf(token: string, fd: FormData) {
  const { db, venueId } = await venueFor(token);
  const s = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const n = (k: string) => { const v = String(fd.get(k) ?? "").trim(); return v && Number.isFinite(Number(v)) ? Number(v) : null; };
  const hours: Record<string, string> = {};
  for (const d of DAYS) { const v = s("hours_" + d); if (v) hours[d] = v; }
  const note = s("hours_note"); if (note) hours.note = note;
  const patch = {
    tagline: (s("tagline") ?? "").slice(0, TAGLINE_MAX) || null, whatsapp: s("whatsapp"), phone: s("phone"), website: s("website"), booking_url: s("booking_url"),
    price_notes: s("price_notes"), height_note: s("height_note"), opening_hours: hours, contact_name: s("contact_name"), contact_whatsapp: s("contact_whatsapp"),
    prices_confirmed_at: new Date().toISOString(), nudge_count: 0, needs_call: false, updated_at: new Date().toISOString(),
  };
  const { error } = await db.from("venues").update(patch).eq("id", venueId);
  if (error) redirect(`/venue/manage/${token}?msg=${encodeURIComponent(error.message)}`);

  // Ticket types: rows are tt_<index>_<field>; existing rows carry an id, blank names are ignored, "remove" deactivates.
  const seen = new Set<string>();
  for (let i = 0; i < 20; i++) {
    const name = s(`tt_${i}_name`); const id = s(`tt_${i}_id`);
    if (!name && !id) continue;
    if (id) {
      seen.add(id);
      if (fd.get(`tt_${i}_remove`) || !name) { await db.from("ticket_types").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id).eq("venue_id", venueId); continue; }
      await db.from("ticket_types").update({ name, description: s(`tt_${i}_description`), price_aed: n(`tt_${i}_price`), ziggadoo_price_aed: n(`tt_${i}_zprice`), sort_order: i, active: true, updated_at: new Date().toISOString() }).eq("id", id).eq("venue_id", venueId);
    } else if (name) {
      const { data: dup } = await db.from("ticket_types").select("id").eq("venue_id", venueId).eq("active", true).eq("name", name).limit(1);
      if (dup?.length) continue;
      await db.from("ticket_types").insert({ venue_id: venueId, name, description: s(`tt_${i}_description`), price_aed: n(`tt_${i}_price`), ziggadoo_price_aed: n(`tt_${i}_zprice`), sort_order: i });
    }
  }
  redirect(`/venue/manage/${token}?msg=saved`);
}

export async function confirmSelf(token: string) {
  const { db, venueId } = await venueFor(token);
  await db.from("venues").update({ prices_confirmed_at: new Date().toISOString(), nudge_count: 0, needs_call: false }).eq("id", venueId);
  redirect(`/venue/manage/${token}?msg=confirmed`);
}
