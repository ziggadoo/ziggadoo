import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data } = await supabase.from("venues").select("slug, updated_at").eq("status", "verified");
  const base = "https://ziggadoo.com";
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...(data ?? []).map((v) => ({ url: `${base}/v/${v.slug}`, lastModified: v.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
