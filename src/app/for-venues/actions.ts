"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function submitEnquiry(fd: FormData) {
  if (String(fd.get("company_website") ?? "")) redirect("/for-venues?msg=ok");
  const s = (k: string) => String(fd.get(k) ?? "").trim().slice(0, 500) || null;
  const name = s("name"); const venue = s("venue_name"); const whatsapp = s("whatsapp"); const email = s("email"); const message = s("message");
  if (!name || !venue || (!whatsapp && !email)) redirect("/for-venues?msg=missing");
  const supabase = await createClient();
  const { error } = await supabase.from("venue_enquiries").insert({ name, venue_name: venue, whatsapp, email, message });
  if (error) redirect("/for-venues?msg=" + encodeURIComponent(error.message));
  await sendEmail({ subject: `New venue enquiry: ${venue}`, text: [`Venue: ${venue}`, `Name: ${name}`, `WhatsApp: ${whatsapp ?? "-"}`, `Email: ${email ?? "-"}`, "", message ?? "", "", "Mark it handled at https://ziggadoo.com/admin"].join("\n"), replyTo: email });
  redirect("/for-venues?msg=ok");
}
