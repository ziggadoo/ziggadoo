import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmailTo } from "@/lib/email";
import { SITE } from "@/lib/pass";

export const dynamic = "force-dynamic";

/** Daily. Asks venues to confirm their details when the last confirmation is over 30 days old: three emails a week apart, then the venue goes on the admin call list. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let db;
  try { db = adminClient(); } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }

  const now = Date.now();
  const cutoff = new Date(now - 30 * 86400000).toISOString();
  const week = new Date(now - 7 * 86400000).toISOString();
  const { data: venues } = await db.from("venues").select("id, name, contact_email, contact_name, prices_confirmed_at, nudge_count, last_nudged_at").eq("status", "verified").eq("needs_call", false).not("contact_email", "is", null).or(`prices_confirmed_at.is.null,prices_confirmed_at.lt.${cutoff}`);
  let sent = 0, flagged = 0;
  for (const v of venues ?? []) {
    if (v.last_nudged_at && v.last_nudged_at > week) continue;
    if (v.nudge_count >= 3) { await db.from("venues").update({ needs_call: true }).eq("id", v.id); flagged++; continue; }
    const { data: t } = await db.from("venue_manage_tokens").insert({ venue_id: v.id, email: v.contact_email }).select("token").single();
    if (!t) continue;
    const nth = v.nudge_count + 1;
    const ok = await sendEmailTo(v.contact_email, nth === 1 ? `Quick check: is your Ziggadoo listing for ${v.name} still right?` : `Reminder ${nth}: please confirm ${v.name} on Ziggadoo`, [
      `Hello${v.contact_name ? " " + v.contact_name : ""},`, "",
      `Once a month we ask every venue to confirm that tickets, prices and opening hours on Ziggadoo are still correct. Parents see "confirmed by the venue" on your listing when they are.`, "",
      `If nothing has changed, open this link and tap "Everything is still correct". If something has, edit it there. Takes a minute:`, `${SITE}/venue/manage/${t.token}`, "",
      nth >= 3 ? "This is our last email; if we don't hear back we'll give you a call." : "The link works for 14 days.", "", "Thank you,", "Ziggadoo",
    ].join("\n"));
    if (ok) { await db.from("venues").update({ nudge_count: nth, last_nudged_at: new Date().toISOString() }).eq("id", v.id); sent++; }
  }
  return NextResponse.json({ sent, flagged });
}
