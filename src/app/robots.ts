import type { MetadataRoute } from "next";

// Kept closed while the site is behind the access code. Flip to allow: ["/"] at launch, together with robots.index in layout.tsx.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" }, sitemap: "https://ziggadoo.com/sitemap.xml" };
}
