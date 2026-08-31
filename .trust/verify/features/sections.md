# sections — page content

Owner code: `src/app/page.tsx`, `src/components/ProjectCard.tsx`, `src/lib/content.ts`.

- **EP-HOME** — `/` renders hero TOP-LEFT (name, role eyebrow, headline, summary, two CTAs — `justify-start pt-28 md:pt-32`, `min-h-dvh` so iOS toolbar collapse can't push content under the fold) with fixed nav; the sky/city scene owns the lower half of the first viewport. CTAs, contact links, and the floating pills all carry `min-h-11` (≥44px tap targets).
- **EP-ANCHORS** — nav links scroll to `#projects #experience #skills #about #contact`; sections carry `scroll-mt-20` so headings clear the h-14 nav.
- **EP-CARDS** — 8 project cards ordered by career aim (Drydock, trust-stack, FIGHT — Shadow League, Mivora, Document Intelligence, Brain, Echinoid ID, Mother Truckin' Pizza), media side alternating; all 8 show `public/projects/*.png` via next/image with `sizes="(min-width: 768px) 50vw, 100vw"`; every image passed a card-size legibility audit 2026-08-31 (fight/echinoid/pizza/drydock cropped to remove dead or truncated regions — declared dims in content.ts must match the real files; rag + brain regenerated with card-legible large labels; truststack is the "what it can do" 2×2 capability grid: STOPS / ROUTES / CHECKS / REMEMBERS + tagline); no Sport IQ strip (removed 2026-08-31); no lesson lines (added then removed same day by operator call); external links open the live sites/repos.
- **EP-EDPX** — experience section carries two education cards: UT Knoxville (B.S. Applied AI, expected 2028) and UCF (CS core with named coursework, GPA 3.58). Contact lists email, phone (tel:+12283572131 — operator explicitly approved publishing 228-357-2131 on 2026-08-31, reversing the earlier do-not-publish note), GitHub, LinkedIn.
- **EP-MOBILE** — mobile preset (375×812): nav shows name only (links hidden by design), cards stack vertically, no horizontal scroll, controls bottom-right don't cover the footer text at rest.

Gotchas: content facts live in `src/lib/content.ts` only — copy edits happen there, never inline in JSX. Echinoid card must never carry an accuracy percentage (recorded honesty mandate).
