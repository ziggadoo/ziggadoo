"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmailTo } from "@/lib/email";
import { SITE } from "@/lib/pass";

/** Emails a manage link for every venue whose contact email matches. Same response whether or not we know the email. */
export async function sendManageLink(fd: FormData) {
  if (String(fd.get("company_website") ?? "")) redirect("/venue/manage?sent=1");
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect("/venue/manage?msg=email");
  const db = adminClient();
  const { data: venues } = await db.from("venues").select("id, name").ilike("contact_email", email).neq("status", "archived");
  if (venues?.length) {
    const links: string[] = [];
    for (const v of venues) {
      const { data: t } = await db.from("venue_manage_tokens").insert({ venue_id: v.id, email }).select("token").single();
      if (t) links.push(`${v.name}: ${SITE}/venue/manage/${t.token}`);
    }
    await sendEmailTo(email, "Your Ziggadoo listing: edit link", [
      "Hello,", "", "Use the link below to update your listing on Ziggadoo: tickets and prices, opening hours, contact details. It works for 14 days.", "",
      ...links, "",
      "If you didn't ask for this, ignore it. Nothing changes unless you save.", "", "Ziggadoo",
    ].join("\n"));
  }
  redirect("/venue/manage?sent=1");
}
