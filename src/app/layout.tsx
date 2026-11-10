import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { site } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.metaTitle,
  description: site.metaDescription,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: "/" },
  // Link previews: without an explicit og:image, scrapers fall back to the
  // first large <img> they find (a project screenshot). og.jpg is a capture of
  // the hero — JPEG, not webp, because several scrapers still skip webp.
  openGraph: {
    title: site.metaTitle,
    description: site.metaDescription,
    url: "/",
    siteName: site.name,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 2400,
        height: 1260,
        alt: `${site.name} — portfolio hero over a rainy neon skyline`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.metaTitle,
    description: site.metaDescription,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#060b14",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
