# sections — page content

Owner code: `src/app/page.tsx`, `src/components/ProjectCard.tsx`, `src/lib/content.ts`.

- **EP-HOME** — `/` renders hero (name, role eyebrow, headline, two CTAs) with fixed nav.
- **EP-ANCHORS** — nav links scroll to `#work #experience #skills #about #contact`; sections carry `scroll-mt-20` so headings clear the h-14 nav.
- **EP-CARDS** — 5 project cards alternate media side; 4 show `public/projects/*.png` via next/image, Drydock shows the terminal panel; Sport IQ collaboration strip after cards; external links open the live sites/repos.
- **EP-MOBILE** — mobile preset (375×812): nav shows name only (links hidden by design), cards stack vertically, no horizontal scroll, controls bottom-right don't cover the footer text at rest.

Gotchas: content facts live in `src/lib/content.ts` only — copy edits happen there, never inline in JSX. Echinoid card must never carry an accuracy percentage (recorded honesty mandate).
