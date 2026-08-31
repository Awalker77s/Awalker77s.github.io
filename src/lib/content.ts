export type Project = {
  name: string;
  badge: "live" | "client build" | "open source" | "local-first" | "in development" | "plugin";
  tagline: string;
  description: string;
  points: string[];
  stack: string[];
  image?: { src: string; alt: string; width: number; height: number };
  terminal?: string[];
  liveUrl?: string;
  repoUrl?: string;
  note?: string;
  lesson?: string;
};

export const site = {
  name: "Alexander Walker",
  role: "AI Automation · Multi-Agent Systems · Orchestration",
  headline: "I build with AI agents — and I'm studying them too.",
  summary:
    "Applied AI student at UT Knoxville. I care most about the gap between what AI models can do and what actually gets deployed inside a real business — so I build products that close it, and ship them to real users.",
  email: "awalker200677@gmail.com",
  github: "https://github.com/Awalker77s",
  linkedin: "https://www.linkedin.com/in/alexander-walker-8b2694243",
};

// Ordered by importance, not date — the descent starts at the flagship.
export const projects: Project[] = [
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
    image: { src: "/projects/fight.png", alt: "FIGHT — Shadow League in-game bout with broadcast HUD", width: 1600, height: 1000 },
    note: "Async tournaments are the next milestone.",
    lesson:
      "I started with full physics self-play RL and had to walk it back to kinematic replay (it's in the decision record). Shipping the game loop first would have found the fun months earlier.",
  },
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
    image: { src: "/projects/drydock.png", alt: "Drydock — automation run timeline with token and cost receipt", width: 1600, height: 1000 },
    note: "Private build — ask me for a walkthrough.",
    lesson:
      "I'd get a code-signing identity on day one. The app is real, but an unsigned Windows installer means SmartScreen stops anyone else from just trying it.",
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
    terminal: [
      "$ claude plugin validate . --strict",
      "  ✔ validation passed",
      "$ node tests/run.js",
      "  hygiene · guards · gate-guard · lint ... all green",
      "  skills 28 · hooks 4 · routing agents 3",
      "  evidence: 79 graded adversarial sims",
      "$ git log --oneline -1",
      "  b43b451 v0.6.0 — the risk layer",
    ],
    lesson:
      "Blind the graders from the start. My first eval pass let the rubric's hopes leak into the grades — only the blinded re-runs are numbers I trust.",
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
    image: { src: "/projects/mivora.png", alt: "Mivora home page — gamified AI skill tracks", width: 1600, height: 1000 },
    liveUrl: "https://mivoralearn.com",
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
    image: { src: "/projects/rag.png", alt: "Document Intelligence — six-stage RAG pipeline architecture", width: 1600, height: 1000 },
    repoUrl: "https://github.com/Awalker77s/Document-Intelligence-Pipeline",
    lesson:
      "Write the README before the code. The pipeline worked, but an empty README made a working repo look abandoned to every visitor who clicked through.",
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
    image: { src: "/projects/brain.png", alt: "Brain — force-directed graph of the real Obsidian vault", width: 1600, height: 1000 },
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
    image: { src: "/projects/echinoid.png", alt: "Echinoid ID — fossil identification interface", width: 1600, height: 1000 },
    liveUrl: "https://echinoid-ui.vercel.app",
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
    image: { src: "/projects/pizza.png", alt: "Mother Truckin' Pizza — menu page", width: 1600, height: 1000 },
    liveUrl: "https://mother-truckin-pizza.vercel.app",
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

export const about = [
  "I'm an Applied AI student at UT Knoxville, after completing the computer science core at UCF. Most of my time goes into building with AI agents — multi-agent systems, orchestration, and the trust layers that make their output safe to ship. Everything on this page is a real build: live users, a real paying client, real captured footage, real test suites.",
  "The thread through all of it is verification. \"The demo worked\" doesn't convince me — I want evals with blinded graders, guardrails that fail closed, evidence ledgers that can't be faked, and honest numbers even when they're unflattering. The gap between what a model can do and what a business will actually deploy is exactly the gap those things close.",
  "This site is part of the portfolio too. The rain, the city, and the water are a custom canvas engine — a spring-column water surface with real ripple physics — and the soundtrack is synthesized live in the Web Audio API: a bright lofi bed at the surface that crossfades into open-fifth deep-water pads as you scroll into the descent. No animation libraries, no audio files.",
];
