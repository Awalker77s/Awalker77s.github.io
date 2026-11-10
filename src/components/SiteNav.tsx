"use client";

import { useEffect, useRef, useState } from "react";
import DepthReadout from "@/components/DepthReadout";
import { sections, site, type SectionId } from "@/lib/content";

export default function SiteNav() {
  const [active, setActive] = useState<SectionId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Scrollspy: the section crossing a line just above mid-viewport is the
  // current one. An observer (not a scroll listener) — it fires only when a
  // section actually crosses the line, a handful of times per full scroll.
  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Adjacent sections can both touch the line for a frame: document
        // order breaks the tie toward the later one (the one being entered).
        const current = [...sections].reverse().find((section) => visible.has(section.id));
        setActive(current ? current.id : null);
      },
      { rootMargin: "-40% 0px -59% 0px" },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // The phone menu closes on Escape and on any press outside the bar.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  return (
    <header ref={navRef} className="site-nav fixed inset-x-0 top-0 z-50 bg-background/60 backdrop-blur">
      <nav aria-label="Primary">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <a href="#top" className="font-semibold text-foreground transition-colors hover:text-accent">
            {site.name}
          </a>
          <div className="flex items-center gap-1 md:gap-6">
            <ul className="hidden items-center gap-6 text-sm md:flex">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={active === section.id ? "location" : undefined}
                    className="nav-link relative py-2 text-faint transition-colors hover:text-foreground aria-[current]:text-foreground"
                  >
                    {section.title.toLowerCase()}
                  </a>
                </li>
              ))}
            </ul>
            <DepthReadout className="md:border-l md:border-edge md:pl-6" />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="-mr-3 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:text-accent md:hidden"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden
              >
                {menuOpen ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M2.5 5h13M2.5 9h13M2.5 13h13" />}
              </svg>
            </button>
          </div>
        </div>

        <div
          id="site-menu"
          className={`${menuOpen ? "block" : "hidden"} absolute inset-x-0 top-full border-b border-edge bg-background md:hidden`}
        >
          <ul className="mx-auto max-w-6xl px-6 py-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active === section.id ? "location" : undefined}
                  className="flex min-h-11 items-center gap-4 text-muted transition-colors hover:text-accent aria-[current]:text-accent"
                >
                  <span className="font-mono text-xs text-faint">{section.index}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* The bar's bottom edge doubles as the depth gauge: an accent line that
          fills as the page sinks. Pure CSS off the engine's --depth token. */}
      <div aria-hidden className="absolute inset-x-0 top-14 h-px -translate-y-px bg-edge/60">
        <div className="depth-gauge h-full origin-left bg-accent/70" />
      </div>
    </header>
  );
}
