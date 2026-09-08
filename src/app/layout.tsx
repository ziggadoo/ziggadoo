import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://ziggadoo.com"),
  title: { default: "ziggadoo", template: "%s | ziggadoo" },
  description: "What shall we do today? Find the right thing to do with your kids in Dubai, for their ages, right now.",
  openGraph: { siteName: "ziggadoo", locale: "en_AE", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f6efe3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
