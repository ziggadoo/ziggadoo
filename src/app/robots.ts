import type { MetadataRoute } from "next";

// Closed while the site is behind the access code. At launch: set OPEN to true here and flip robots.index in layout.tsx.
const OPEN = false;
// Never indexed, even after launch.
const PRIVATE = ["/admin", "/venues/submit", "/venue/manage", "/pass/", "/api/", "/auth/", "/login", "/enter"];

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: OPEN ? PRIVATE : "/" }, sitemap: "https://ziggadoo.com/sitemap.xml" };
}
