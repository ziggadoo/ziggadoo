"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";

export async function markUsed(code: string) {
  const db = adminClient();
  await db.from("passes").update({ status: "used", used_at: new Date().toISOString() }).eq("code", code).eq("status", "issued");
  redirect(`/pass/check/${code}`);
}
