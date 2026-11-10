import type { Metadata } from "next";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: `Nothing at this depth — ${site.name}`,
  robots: { index: false },
};

// GitHub Pages serves this for every unknown path. No scene here on purpose:
// a wrong URL should cost one small page and one obvious way back.
export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col justify-center bg-background">
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">404 · off the chart</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          Nothing at this depth.
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted">
          That page isn&apos;t here — it may have moved, or the link was mistyped.
        </p>
        <div className="mt-8">
          {/* A full page load, not a client transition: the home page boots a
              canvas engine and should start from a clean document. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-bright"
          >
            <span aria-hidden>↑</span> Back to the surface
          </a>
        </div>
      </div>
    </main>
  );
}
