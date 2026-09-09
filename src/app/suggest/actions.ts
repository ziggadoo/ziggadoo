"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitSuggestion(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/suggest");
  const s = (k: string) => { const v = String(fd.get(k) ?? "").trim(); return v || null; };
  const name = s("name");
  if (!name) redirect("/suggest?msg=name");
  const { error } = await supabase.from("venue_suggestions").insert({ profile_id: user.id, name, area: s("area"), url: s("url"), note: s("note") });
  redirect(`/suggest?msg=${error ? encodeURIComponent(error.message) : "ok"}`);
}
