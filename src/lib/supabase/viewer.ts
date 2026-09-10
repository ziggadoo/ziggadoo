import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** True when the browser sent a Supabase session cookie. Without one there is no user, so we skip the auth round trip. */
export async function hasSessionCookie(): Promise<boolean> {
  const store = await cookies();
  return store.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

/** Current user and admin flag, resolved once per request and shared by page, footer and actions. */
export const getViewer = cache(async () => {
  if (!(await hasSessionCookie())) return { user: null, isAdmin: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { user, isAdmin: data?.role === "admin" };
});
