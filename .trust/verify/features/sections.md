# sections — page content

Owner code: `src/app/page.tsx`, `src/components/ProjectCard.tsx`, `src/lib/content.ts`.

- **EP-HOME** — `/` renders hero (name, role eyebrow, headline, two CTAs) with fixed nav.
- **EP-ANCHORS** — nav links scroll to `#projects #experience #skills #about #contact`; sections carry `scroll-mt-20` so headings clear the h-14 nav.
- **EP-CARDS** — 8 project cards in importance order (FIGHT — Shadow League, Drydock, trust-stack, Mivora, Document Intelligence, Brain, Echinoid ID, Mother Truckin' Pizza), media side alternating; 7 show `public/projects/*.png` via next/image (fight/drydock/brain/rag are locally-captured or generated — see the regen notes in each scratch script's header comment), trust-stack shows the terminal panel; four cards carry a "What I'd change" lesson line (renders uppercase-labeled — match it case-insensitively); no Sport IQ strip (removed 2026-08-31); external links open the live sites/repos.
- **EP-EDPX** — experience section carries two education cards: UT Knoxville (B.S. Applied AI, expected 2028) and UCF (CS core with named coursework, GPA 3.58). Contact lists email, GitHub, LinkedIn.
- **EP-MOBILE** — mobile preset (375×812): nav shows name only (links hidden by design), cards stack vertically, no horizontal scroll, controls bottom-right don't cover the footer text at rest.

Gotchas: content facts live in `src/lib/content.ts` only — copy edits happen there, never inline in JSX. Echinoid card must never carry an accuracy percentage (recorded honesty mandate).
