import { NextResponse, type NextRequest } from "next/server";

export const ACCESS_COOKIE = "zg_access";
export const ACCESS_TOKEN = "ok-2026-09";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/enter") || pathname.startsWith("/api/enter") || pathname.startsWith("/api/health") || pathname === "/sitemap.xml" || pathname === "/robots.txt" || pathname.startsWith("/illustrations/")) {
    return NextResponse.next();
  }
  if (req.cookies.get(ACCESS_COOKIE)?.value === ACCESS_TOKEN) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/enter";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
