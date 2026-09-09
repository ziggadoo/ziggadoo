"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ziggadoo.com";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/");
  if (!email) redirect("/login?error=email");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}

export async function signInWithGoogle(formData: FormData) {
  const next = String(formData.get("next") ?? "/");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${SITE}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "google")}`);
  redirect(data.url);
}
