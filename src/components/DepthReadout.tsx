"use client";

import { useEffect, useRef } from "react";
import { depthMetres, depthZone, subscribeDepth } from "@/lib/depth";

const DIGITS = 4;

// A dive-computer readout for the page: how far under the waterline the
// reader has scrolled, and which ocean light zone that is. Scrolling becomes
// visible progress (docs/research/underwater-city/underwater-scroll.md, Q5).
// Text is written straight to the DOM from the engine's depth stream — no
// React re-render per scrolled frame.
export default function DepthReadout({ className = "" }: { className?: string }) {
  const padRef = useRef<HTMLSpanElement>(null);
  const metresRef = useRef<HTMLSpanElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      subscribeDepth((depth) => {
        // Fixed four-digit field, leading zeros dimmed — an instrument
        // readout whose width never changes, so the nav never jitters.
        const digits = String(Math.round(depthMetres(depth)));
        if (padRef.current) padRef.current.textContent = "0".repeat(Math.max(0, DIGITS - digits.length));
        if (metresRef.current) metresRef.current.textContent = digits;
        if (zoneRef.current) zoneRef.current.textContent = depthZone(depth);
      }),
    [],
  );

  // Decorative for assistive tech: the numbers change on every scrolled frame
  // and say nothing a screen-reader user needs (headings carry the structure).
  return (
    <div
      aria-hidden
      data-depth-readout
      className={`flex items-center gap-2 font-mono text-[11px] leading-none text-faint ${className}`}
    >
      <svg width="9" height="11" viewBox="0 0 9 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
        <path d="M4.5 1v9M1 6.5 4.5 10 8 6.5" />
      </svg>
      <span className="tabular-nums text-muted">
        <span ref={padRef} className="text-ghost">
          000
        </span>
        <span ref={metresRef}>0</span> m
      </span>
      <span ref={zoneRef} className="hidden min-w-[13ch] text-faint lg:inline">
        surface
      </span>
    </div>
  );
}
