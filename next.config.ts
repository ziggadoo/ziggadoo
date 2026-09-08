import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "snzrrwuekoyvozfzeihh.supabase.co" }],
  },
};

export default nextConfig;
