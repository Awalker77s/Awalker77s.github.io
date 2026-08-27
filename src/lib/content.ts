export type Project = {
  name: string;
  badge: "live" | "client build" | "open source" | "local-first";
  tagline: string;
  description: string;
  points: string[];
  stack: string[];
  image?: { src: string; alt: string; width: number; height: number };
  terminal?: string[];
  liveUrl?: string;
  repoUrl?: string;
  note?: string;
};

export const site = {
  name: "Alexander Walker",
  role: "AI Automation · Multi-Agent Systems · Orchestration",
  headline: "I build with AI agents — and I'm studying them too.",
  summary:
    "Applied AI student at UT Knoxville. I care most about the gap between what AI models can do and what actually gets deployed inside a real business — so I build products that close it, and ship them to real users.",
  email: "awalker200677@gmail.com",
  github: "https://github.com/Awalker77s",
};

export const projects: Project[] = [
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
    name: "Drydock",
    badge: "local-first",
    tagline: "Automation you can audit.",
    description:
      "A local-first automation platform that records real browser and desktop actions, then replays them with local models — escalating to a Claude subscription only when a step actually needs it. No API keys anywhere.",
    points: [
      "Chrome extension + native-messaging browser hand; Windows desktop hand on UI Automation at ~115 ms per call",
      "Local vision grounding places clicks within 4–5 px",
      "Graded safety gate and a hash-chained evidence ledger for every run",
      "3,500+ automated tests, green",
    ],
    stack: ["TypeScript", "Chrome MV3", "Windows UIA", "Ollama", "Claude"],
    terminal: [
      "$ drydock verify --full",
      "  suite ........... 3,500+ tests, green",
      "  browser hand .... Chrome MV3 + native messaging",
      "  desktop hand .... Windows UIA, ~115 ms/call",
      "  vision .......... local grounding, 4–5 px",
      "  evidence ........ hash-chained ledger, graded safety gate",
      "  api keys ........ none",
    ],
    note: "Private build — ask me for a walkthrough.",
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
  {
    name: "PrivatePilot",
    badge: "open source",
    tagline: "Local-first automation copilot.",
    description:
      "ImpactForge hackathon build, team of three — I owned the automation engine end-to-end: natural language in, scheduled multi-step automations out, running entirely on local Ollama models.",
    points: [
      "Chained automations with approval gates — you approve the sequence before it runs",
      "Fully local: Ollama models, no cloud keys, honest failure reporting (“I couldn't read the price, so I stopped rather than guess”)",
      "Built in a weekend; MIT-licensed and public",
    ],
    stack: ["TypeScript", "React", "Node", "Ollama"],
    image: { src: "/projects/privatepilot.png", alt: "PrivatePilot automations — scheduled agent sequences with approval gates", width: 1500, height: 975 },
    repoUrl: "https://github.com/Awalker77s/PrivatePilot",
  },
];

export const collaboration = {
  name: "Sport IQ",
  text: "Collaborator on Mustapha324's MLB/NFL prediction platform — contributed board-aligned player props and a game-brain backtest with champion–challenger promotion (PRs #55 & #56, in review).",
  repoUrl: "https://github.com/Mustapha324/mlb-win-predictor",
};

export const experience = [
  {
    company: "Relevate Health",
    role: "AI Development Intern",
    period: "Summer 2026",
    description:
      "Designed multi-agent systems that automated parts of the software development lifecycle: how specialized agents coordinate and hand off work, the validation and test harnesses that check their output, and the guardrails and human-in-the-loop controls that make them safe to trust.",
  },
  {
    company: "Outamation",
    role: "AI Engineering Extern",
    period: "Externship",
    description:
      "Built document-intelligence pipelines that processed 200+ page mortgage files using OCR, retrieval-augmented generation, and LlamaIndex-based search.",
  },
];

export const education = {
  school: "University of Tennessee, Knoxville",
  degree: "B.S. Applied Artificial Intelligence",
  detail: "In progress — after completing the computer science core at UCF.",
};

export const skillGroups = [
  {
    title: "AI automation & implementation",
    skills: ["Workflow automation", "Deployment-gap analysis", "Human-in-the-loop design", "Evaluation harnesses"],
  },
  {
    title: "Agent orchestration",
    skills: ["Multi-agent design", "Handoffs & coordination", "Validation & guardrails", "Claude Code", "MCP"],
  },
  {
    title: "LLM pipelines",
    skills: ["RAG", "Retrieval & search", "OCR pipelines", "LlamaIndex", "Prompt design"],
  },
  {
    title: "Full-stack",
    skills: ["TypeScript", "React", "Next.js", "Python", "Node", "Supabase", "PostgreSQL"],
  },
];

export const about = [
  "I'm an Applied AI student at UT Knoxville. Most of my time goes into building with AI agents — multi-agent systems, orchestration, and the validation layers that make their output trustworthy — and into studying how people actually get good at using them.",
  "What I care about most is the gap between what AI models can do and what actually gets deployed inside a real business. Everything above is a real product: live users, real clients, honest evaluation numbers.",
  "This site is part of the portfolio too: the rain is a custom canvas engine — a spring-column water surface with drop impacts and splash particles — and the sound is synthesized from filtered noise in the Web Audio API. No animation libraries, no audio files.",
];
