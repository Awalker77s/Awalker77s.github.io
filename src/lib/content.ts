export type ProjectImage = { src: string; alt: string; width: number; height: number };

export type Project = {
  name: string;
  badge: "live" | "client build" | "open source" | "local-first" | "in development" | "plugin";
  tagline: string;
  description: string;
  points: string[];
  stack: string[];
  // Card gallery: first image leads; arrows page through the rest, and any
  // image expands to a lightbox on click (dense diagrams go later in the
  // list — they're meant to be read expanded).
  images: ProjectImage[];
  repoUrl?: string;
  note?: string;
};

export const site = {
  name: "Alexander Walker",
  role: "AI Automation · Multi-Agent Systems · Orchestration",
  headline: "I build AI systems that ship — and prove they work.",
  summary:
    "Applied AI student at UT Knoxville. I care most about the gap between what AI models can do and what actually gets deployed inside a real business — so I build products that close it, and ship them to real users.",
  email: "awalker200677@gmail.com",
  phone: "228-357-2131",
  github: "https://github.com/Awalker77s",
  linkedin: "https://www.linkedin.com/in/alexander-walker-8b2694243",
};

// Ordered by what he's aiming for — AI automation and agent systems lead,
// the descent starts at the flagship.
export const projects: Project[] = [
  {
    name: "Drydock",
    badge: "local-first",
    tagline: "Automation you can audit.",
    description:
      "A Windows desktop app that turns a demonstrated task into a repeatable automation: rehearse it against a copy of your files, watch the diff before anything real is touched, then run it with receipts. Each step routes to the cheapest engine that can do it — plain code, a local model, or your existing Claude subscription. No API keys anywhere.",
    points: [
      "Chrome extension + native-messaging browser hand; Windows desktop hand on UI Automation at ~115 ms per call",
      "Local vision grounding places clicks within 4–5 px",
      "Graded action ladder (read → fill → full) and a hash-chained evidence ledger behind every trust badge",
      "3,500+ automated tests, green — including an adversarial check that sensitive runs have no network rail reachable",
    ],
    stack: ["Electron", "TypeScript", "React", "Chrome MV3", "Windows UIA", "Ollama", "Claude Code"],
    images: [
      { src: "/projects/drydock-chat.webp", alt: "Drydock — the Chat tab: a plain-English request drafted in the composer, with your own Claude connected", width: 2000, height: 703 },
      { src: "/projects/drydock.webp", alt: "Drydock — automation run timeline with token and cost receipt", width: 2000, height: 1030 },
      { src: "/projects/drydock-editor.webp", alt: "Drydock — an automation's detail sheet: when it runs, which files it reads, what you get, allowed tools, and past runs, with the 'Claude never sees it' privacy badge", width: 2000, height: 1032 },
    ],
    note: "Private build — ask me for a walkthrough.",
  },
  {
    name: "trust-stack",
    badge: "plugin",
    tagline: "Flight rules for AI coding agents.",
    description:
      "A Claude Code plugin that splits agent governance into policy the model reads (28 skills) and enforcement it can't skip (4 lifecycle hooks): frozen paths and git bypass flags become human approval questions, context handoffs are scheduled before quality degrades, and every decision lands in an append-only ledger.",
    points: [
      "Every skill was admitted on evidence: 79 graded adversarial simulations with pre-registered rubrics and blinded graders",
      "Guards fail closed — malformed input produces an approval question, never a silent disarm",
      "Risk-tiered ceremony: a typo fix auto-merges, a deploy can't happen without the human",
      "Maker–checker separation: a fresh-context agent reviews what the builder produced, and it has caught real bypasses",
    ],
    stack: ["Node", "Claude Code", "Hooks API", "Zero dependencies"],
    images: [
      {
        src: "/projects/truststack.webp",
        alt: "trust-stack flight console — an agent action falls through the skills field (advice) into the hooks wall (physics), splitting to auto-merge or human approval, with the capability list alongside.",
        width: 1600,
        height: 780,
      },
      {
        src: "/projects/truststack-grid.webp",
        alt: "trust-stack capability grid — STOPS: --no-verify becomes a question; ROUTES: low risk merges, high risk waits; CHECKS: catches bypasses humans miss; REMEMBERS: every decision permanently logged.",
        width: 1600,
        height: 780,
      },
    ],
  },
  {
    name: "FIGHT — Shadow League",
    badge: "in development",
    tagline: "Your training footage becomes your fighter.",
    description:
      "Film a shadowboxing session and a from-scratch computer-vision pipeline (GEM-X → SOMA skeletons) turns it into your \"Shadow\" — a motion-captured 3D fighter in a deterministic 60 Hz fighting game with full broadcast presentation. Solo-built, from the ML pipeline to the game engine.",
    points: [
      "Real captured footage drives the fighter: watch your own filmed session replayed on a 3D skeleton in the Film Room",
      "Deterministic client-side fight engine — guard, slips, counters, stamina, knockdowns, three-round bouts with judges",
      "Broadcast layer: fighter intros, round cards, live HUD, KO and decision overlays, three-tier AI opponents",
      "Loadout economy with an equip/store/workshop hub and a live 3D preview of every move you touch",
    ],
    stack: ["Next.js", "React", "TypeScript", "Three.js", "Tailwind", "Python (CV pipeline)"],
    images: [
      { src: "/projects/fight.webp", alt: "FIGHT — Shadow League in-game bout with broadcast HUD", width: 1600, height: 880 },
      { src: "/projects/fight-robot.webp", alt: "FIGHT — the ATLAS-R fighter front-on in the Film Room, guard up under the ring spotlight", width: 1600, height: 1000 },
      { src: "/projects/fight-practice.webp", alt: "FIGHT — Practice in the basement: the robot squares up with a ghost partner under one bare bulb, drill presets and the punch deck alongside", width: 1600, height: 1000 },
      { src: "/projects/fight-loadout.webp", alt: "FIGHT — the Loadout hub: five equip slots, the move store, credits, and the fighter glowing with equipped gear", width: 1600, height: 1000 },
      { src: "/projects/fight-menu.webp", alt: "FIGHT — mode select: Fight, Loadout, Practice, Watch, Training, and Physics Lab over the empty ring", width: 1600, height: 1000 },
    ],
    note: "Async tournaments are the next milestone.",
  },
  {
    name: "Mivora",
    badge: "live",
    tagline: "Get genuinely good at AI.",
    description:
      "A free, gamified platform for building real AI skill — prompting, agents, retrieval, evaluation — with strict sequential mastery instead of passive video watching.",
    points: [
      "55-lesson flagship track; each lesson must be mastered before the next unlocks",
      "FSRS-6 spaced-repetition review scheduling, fully client-side",
      "Certificates of Mastery verified server-side and publicly checkable",
      "Runs at $0: static site + Supabase, zero runtime LLM calls",
    ],
    stack: ["TypeScript", "React", "Vite", "Supabase", "ts-fsrs", "Vercel"],
    images: [
      { src: "/projects/mivora.webp", alt: "Mivora home page — gamified AI skill tracks", width: 1600, height: 1000 },
      { src: "/projects/mivora-track.webp", alt: "Mivora — the Building with AI path: lesson 1 mastered with its project piece built, lesson 2 unlocked, later lessons locked behind the mastery checkpoint", width: 1600, height: 1000 },
      { src: "/projects/mivora-practice.webp", alt: "Mivora — a mastery-check question mid-lesson: instant verdict, the worked explanation, and Pando the mascot cheering the streak", width: 1600, height: 1000 },
      { src: "/projects/mivora-lesson.webp", alt: "Mivora lesson page — Bit vs. Qubit, lesson 1 of the Quantum Computing track", width: 1600, height: 1000 },
      { src: "/projects/mivora-progress.webp", alt: "Mivora — the progress dashboard: level ring, XP, tokens, Bronze league, streaks, avatars, and unlockable titles", width: 1600, height: 1000 },
    ],
  },
  {
    name: "Document Intelligence",
    badge: "open source",
    tagline: "RAG that shows its sources.",
    description:
      "A retrieval-augmented Q&A pipeline for PDFs: PyMuPDF extraction with a Tesseract OCR fallback for scanned pages, overlap-aware chunking, MiniLM embeddings in a FAISS index, and answers that cite the exact source and page inline.",
    points: [
      "Retrieval runs entirely locally and free — MiniLM + FAISS, no paid API in the loop",
      "Answers carry forced inline [S1]/[S2] citations with document, page, and similarity score",
      "No API key? It degrades honestly: ranked, cited source passages instead of a synthesized answer",
      "Refuses to answer when the sources don't contain it — no confident hallucination path",
    ],
    stack: ["Python", "PyMuPDF", "Tesseract", "Sentence-Transformers", "FAISS", "OpenAI", "Gradio"],
    images: [
      { src: "/projects/rag-detail.webp", alt: "Document Intelligence — detailed architecture with per-stage internals, fallbacks, and model choices (expand to read)", width: 1600, height: 1000 },
      { src: "/projects/rag.webp", alt: "Document Intelligence — five-stage RAG pipeline: ingest, chunk, embed, retrieve, generate", width: 1600, height: 1000 },
    ],
    repoUrl: "https://github.com/Awalker77s/Document-Intelligence-Pipeline",
  },
  {
    name: "Brain",
    badge: "local-first",
    tagline: "The vault every agent reads first.",
    description:
      "An Obsidian knowledge vault that acts as the memory layer over 25+ project repos: before any AI agent touches a project, it reads that project's note — what it is, where it stands, what's next — and writes its session back when it's done. Code lives in git; meaning lives here.",
    points: [
      "One note per repo with typed status, next action, and a dated decision log — supersede, never delete",
      "Parallel agents can't clobber shared state: all writes flow through a single-writer inbox a librarian pass consolidates",
      "Weekly and monthly review rituals keep the index honest — a wrong note is treated as worse than no note",
      "The graph you're looking at is the real vault, rendered from its actual wikilinks",
    ],
    stack: ["Obsidian", "Markdown", "Git", "Claude Code"],
    images: [
      { src: "/projects/brain.webp", alt: "Brain — force-directed graph of the real Obsidian vault", width: 1600, height: 1000 },
    ],
  },
  {
    name: "Echinoid ID",
    badge: "live",
    tagline: "Identify fossil echinoids with expert confidence.",
    description:
      "AI-assisted identification of fossil sea urchins, built on Bill Thompson's taxonomy. Upload photos, get top-3 candidates with evidence, clarifying questions — and honest confidence levels, no false certainty.",
    points: [
      "Reference corpus distilled from a 1,873-page monograph: 219 species across 445 sections",
      "Top-3 identifications with per-candidate evidence and follow-up questions",
      "Committed evaluation harness with per-case failure decomposition — honest numbers over marketing numbers",
      "3 free IDs, then Stripe-billed Pro",
    ],
    stack: ["TypeScript", "React", "Supabase", "Edge Functions", "OpenAI", "Stripe"],
    images: [
      { src: "/projects/echinoid.webp", alt: "Echinoid ID — fossil identification interface", width: 1600, height: 965 },
      { src: "/projects/echinoid-identify.webp", alt: "Echinoid ID — identifying a specimen: a fossil photo attached as the aboral view, with free identifications remaining", width: 1600, height: 1000 },
      { src: "/projects/echinoid-collection.webp", alt: "Echinoid ID — Bill Thompson's species database: genus, family, formation, and age for each reference specimen, with draft entries", width: 1600, height: 1000 },
      { src: "/projects/echinoid-how.webp", alt: "Echinoid ID — how it works: upload photos, add field details, analyze features, compare", width: 1600, height: 1000 },
    ],
  },
  {
    name: "Mother Truckin' Pizza",
    badge: "client build",
    tagline: "A real client, a real truck.",
    description:
      "Ground-up rebuild for a Jacksonville food-truck business: public site plus an owner admin panel for the schedule, the menu, and event bookings.",
    points: [
      "Event-inquiry pipeline with Supabase persistence, Resend transactional email, and idempotency protection",
      "Owner admin: schedule, menu, and an inquiry workflow (New → Contacted → Approved → Booked)",
      "Dual-mode data layer — Supabase in production, localStorage for local dev",
    ],
    stack: ["React", "Vite", "Tailwind", "Supabase", "Resend", "Vercel"],
    images: [
      { src: "/projects/pizza-home.webp", alt: "Mother Truckin' Pizza — home page hero with photo collage and stats (10+ years rolling, 500+ events catered)", width: 1600, height: 1000 },
      { src: "/projects/pizza.webp", alt: "Mother Truckin' Pizza — menu page", width: 1600, height: 765 },
      { src: "/projects/pizza-catering.webp", alt: "Mother Truckin' Pizza — catering page with wedding, corporate, party, and festival service cards", width: 1600, height: 1000 },
    ],
  },
];

export const experience = [
  {
    company: "Relevate Health",
    role: "AI Development Intern",
    period: "Summer 2026",
    description:
      "Architected multi-agent systems that automated parts of the software development lifecycle — agent coordination and handoffs, the validation and test harnesses that check their output, and the guardrails and human-in-the-loop controls that make them safe to trust. Authored the company-wide adoption proposal approved by leadership.",
  },
  {
    company: "Outamation",
    role: "AI Engineering Extern",
    period: "Oct 2025 – Mar 2026",
    description:
      "Built document-intelligence pipelines that processed 200+ page mortgage files using OCR, retrieval-augmented generation, and LlamaIndex-based search with metadata filtering and chunk tuning.",
  },
];

export const education = [
  {
    school: "University of Tennessee, Knoxville",
    degree: "B.S. Applied Artificial Intelligence",
    detail: "In progress — expected 2028.",
  },
  {
    school: "University of Central Florida",
    degree: "Computer science core, completed before transferring",
    detail:
      "GPA 3.58 — Data Structures, Algorithms, Systems Software, Object-Oriented Programming, C Programming, Discrete Structures, Computer Logic & Organization.",
  },
];

export const skillGroups = [
  {
    title: "Agent orchestration",
    skills: ["Multi-agent design", "Handoffs & coordination", "Guardrails & human-in-the-loop", "Context engineering", "Claude Code", "MCP"],
  },
  {
    title: "Evals & verification",
    skills: ["Evaluation harnesses", "Adversarial testing", "Blinded grading", "Regression gates", "Honest failure analysis"],
  },
  {
    title: "LLM pipelines",
    skills: ["RAG", "Retrieval & search", "OCR pipelines", "LlamaIndex", "Prompt design"],
  },
  {
    title: "AI automation",
    skills: ["Workflow automation", "Browser & desktop automation", "Local-first models (Ollama)", "Deployment-gap analysis"],
  },
  {
    title: "Full-stack",
    skills: ["TypeScript", "React", "Next.js", "Python", "Node", "Electron", "Three.js", "Supabase", "PostgreSQL"],
  },
];

// Short labels for the sky blimps' screens — one skill per crossing. Kept
// under ~19 chars so the baked screen text stays legible; the long-form
// versions live in skillGroups.
export const blimpSkills = [
  "Multi-agent design",
  "Claude Code",
  "Orchestration",
  "Eval harnesses",
  "Adversarial testing",
  "Guardrails & HITL",
  "Context engineering",
  "RAG pipelines",
  "OCR pipelines",
  "Prompt design",
  "TypeScript",
  "React / Next.js",
  "Python",
  "Node",
  "Electron",
  "Three.js",
  "Supabase",
  "PostgreSQL",
  "MCP",
];

export const about = [
  "I'm an Applied AI student at UT Knoxville, after completing the computer science core at UCF. Most of my time goes into building with AI agents — multi-agent systems, orchestration, and the trust layers that make their output safe to ship. Everything on this page is a real build: live users, a real paying client, real captured footage, real test suites.",
  "The thread through all of it is verification. \"The demo worked\" doesn't convince me — I want evals with blinded graders, guardrails that fail closed, evidence ledgers that can't be faked, and honest numbers even when they're unflattering. The gap between what a model can do and what a business will actually deploy is exactly the gap those things close.",
  "This site is part of the portfolio too. The rain, the city, and the water are a custom canvas engine — a spring-column water surface with real ripple physics — and the soundtrack is synthesized live in the Web Audio API: a bright bed at the surface that crossfades into a swung lofi beat under warm pads once you dive, with a synthesized splash at the waterline. No animation libraries, no audio files.",
];
