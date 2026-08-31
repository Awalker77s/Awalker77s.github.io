import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://awalker77s.github.io"),
  title: "Alexander Walker — AI Automation & Multi-Agent Systems",
  description:
    "Applied AI student at UT Knoxville. I design multi-agent systems, LLM pipelines, and full-stack products — and ship them to real users.",
  // Link previews: without an explicit og:image, scrapers fall back to the
  // first large <img> they find (a project screenshot). og.jpg is a capture of
  // the hero — JPEG, not webp, because several scrapers still skip webp.
  openGraph: {
    title: "Alexander Walker — AI Automation & Multi-Agent Systems",
    description:
      "Applied AI student at UT Knoxville. I design multi-agent systems, LLM pipelines, and full-stack products — and ship them to real users.",
    url: "/",
    siteName: "Alexander Walker",
    type: "website",
    images: [{ url: "/og.jpg", width: 2400, height: 1260, alt: "Alexander Walker — portfolio hero over a rainy neon skyline" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexander Walker — AI Automation & Multi-Agent Systems",
    description:
      "Applied AI student at UT Knoxville. I design multi-agent systems, LLM pipelines, and full-stack products — and ship them to real users.",
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
