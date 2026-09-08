import { NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_TOKEN } from "@/middleware";

const CODE = process.env.ACCESS_CODE ?? "letsegooo";

export async function POST(req: Request) {
  const form = await req.formData();
  const code = String(form.get("code") ?? "").trim().toLowerCase();
  const url = new URL(req.url);
  if (code !== CODE.toLowerCase()) {
    return NextResponse.redirect(new URL("/enter?wrong=1", url.origin), 303);
  }
  const res = NextResponse.redirect(new URL("/", url.origin), 303);
  res.cookies.set(ACCESS_COOKIE, ACCESS_TOKEN, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  return res;
}
