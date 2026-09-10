"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmailTo } from "@/lib/email";
import { dubaiToday, fmtDate, newPassCode, SITE, aed } from "@/lib/pass";

export async function createPass(fd: FormData) {
  const slug = String(fd.get("venue") ?? "");
  const ticketId = String(fd.get("ticket") ?? "");
  const date = String(fd.get("date") ?? "");
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const whatsapp = String(fd.get("whatsapp") ?? "").trim() || null;
  const kids = Number(fd.get("kids")) || null;
  const back = `/pass/new?venue=${encodeURIComponent(slug)}&ticket=${encodeURIComponent(ticketId)}`;
  if (String(fd.get("company_website") ?? "")) redirect("/");
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect(back + "&msg=email");
  const today = dubaiToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) redirect(back + "&msg=date");

  const supabase = await createClient();
  const { data: v } = await supabase.from("venues").select("id, name, slug, passes_enabled, address, whatsapp").eq("slug", slug).maybeSingle();
  if (!v || !v.passes_enabled) redirect(`/v/${slug}?msg=nopass`);
  const { data: t } = await supabase.from("ticket_types").select("id, name, price_aed, ziggadoo_price_aed").eq("id", ticketId).eq("venue_id", v.id).eq("active", true).maybeSingle();
  if (!t) redirect(`/v/${slug}?msg=nopass`);

  let db;
  try { db = adminClient(); } catch { redirect(back + "&msg=setup"); }
  let created: { token: string; code: string } | null = null;
  for (let i = 0; i < 5 && !created; i++) {
    const code = newPassCode();
    const { data, error } = await db.from("passes").insert({ code, venue_id: v.id, ticket_type_id: t.id, ticket_name: t.name, price_aed: t.price_aed, ziggadoo_price_aed: t.ziggadoo_price_aed, visit_date: date, kids, email, whatsapp }).select("token, code").single();
    if (!error && data) created = data;
  }
  if (!created) redirect(back + "&msg=retry");

  const link = `${SITE}/pass/${created.token}`;
  await sendEmailTo(email, `Your Ziggadoo pass for ${v.name}, ${fmtDate(date)}`, [
    `Here is your Ziggadoo pass for ${v.name}.`, "",
    `Ticket: ${t.name}`, `Ziggadoo price: ${aed(t.ziggadoo_price_aed)}${t.price_aed ? ` (usually ${aed(t.price_aed)})` : ""}`, `Date: ${fmtDate(date)}`, `Code: ${created.code}`, "",
    `Open your pass: ${link}`, "",
    "Show it at the door and pay the Ziggadoo price there. It is valid on the date shown only. Nothing has been charged and nothing is reserved; if plans change, just don't go.",
    v.address ? `Address: ${v.address}` : "", "",
    "Ziggadoo, made by parents, for parents.",
  ].filter((l) => l !== undefined).join("\n"));
  redirect(`/pass/${created.token}?new=1`);
}
