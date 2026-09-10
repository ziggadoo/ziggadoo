import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const ACCESS_COOKIE = "zg_access";
export const ACCESS_TOKEN = "ok-2026-09";

// Routes that work without the preview access code. Venue-facing forms must be open: venues don't have the code.
const OPEN = ["/enter", "/api/enter", "/api/health", "/auth/", "/sitemap.xml", "/robots.txt", "/illustrations/", "/terms", "/privacy", "/contact", "/for-venues", "/venues/submit", "/venue/manage", "/pass/", "/api/cron/", "/logo", "/og-image"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isOpen = OPEN.some((p) => pathname === p || pathname.startsWith(p));
  if (!isOpen && req.cookies.get(ACCESS_COOKIE)?.value !== ACCESS_TOKEN) {
    const url = req.nextUrl.clone();
    url.pathname = "/enter";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Only refresh the Supabase session when there is one. Anonymous visitors skip the auth round trip entirely.
  const hasSession = req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  let res = NextResponse.next({ request: req });
  if (!hasSession) return res;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet: { name: string; value: string; options?: CookieOptions }[]) => {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return res;
}

// Static files (images, illustrations, venue photos) never go through the middleware.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|illustrations/|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"] };
