import { createClient as create } from "@supabase/supabase-js";

/** Server-only client with the service role key. Used for passes, venue self-service and the nudge cron, which bypass RLS on purpose.
 *  Never import this from a client component. Requires SUPABASE_SERVICE_ROLE_KEY in Vercel. */
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return create(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
