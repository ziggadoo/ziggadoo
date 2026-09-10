"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function reportPass(token: string, fd: FormData) {
  const note = String(fd.get("note") ?? "").trim().slice(0, 500) || null;
  const db = adminClient();
  const { data: p } = await db.from("passes").select("id, code, visit_date, ticket_name, ziggadoo_price_aed, venues(name)").eq("token", token).maybeSingle();
  if (!p) redirect("/");
  await db.from("pass_reports").insert({ pass_id: p.id, note });
  await db.from("passes").update({ status: "reported" }).eq("id", p.id);
  const vname = (p.venues as unknown as { name: string } | null)?.name ?? "?";
  await sendEmail({ subject: `Pass not honoured: ${vname}`, text: [`Venue: ${vname}`, `Pass: ${p.code}, ${p.ticket_name} at AED ${p.ziggadoo_price_aed}, ${p.visit_date}`, "", note ?? "(no note)", "", "Call the venue today."].join("\n") });
  redirect(`/pass/${token}?reported=1`);
}
