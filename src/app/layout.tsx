import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://ziggadoo.com"),
  title: { default: "ziggadoo", template: "%s | ziggadoo" },
  description: "What shall we do today? Find the right thing to do with your kids in Dubai, for their ages, right now.",
  robots: { index: false, follow: false },
  openGraph: { siteName: "ziggadoo", locale: "en_AE", type: "website", images: [{ url: "/og-image.jpg", width: 1200, height: 630 }] },
};

export const viewport: Viewport = { themeColor: "#f6efe3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-dvh">{children}<Footer /></body>
    </html>
  );
}
