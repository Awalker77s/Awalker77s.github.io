import Atmosphere from "@/components/Atmosphere";
import CopyButton from "@/components/CopyButton";
import ProjectCard from "@/components/ProjectCard";
import SiteNav from "@/components/SiteNav";
import {
  about,
  contact,
  education,
  experience,
  footer,
  projects,
  sections,
  site,
  skillGroups,
  type SectionId,
} from "@/lib/content";

const section = Object.fromEntries(sections.map((entry) => [entry.id, entry])) as Record<
  SectionId,
  (typeof sections)[number]
>;

function SectionHeading({ id }: { id: SectionId }) {
  const { index, title } = section[id];
  return (
    <div className="reveal flex items-center gap-4">
      <span aria-hidden className="font-mono text-sm text-accent">
        {index}
      </span>
      <h2 id={`${id}-title`} className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-edge to-transparent" />
    </div>
  );
}

const chip =
  "rounded border border-edge bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-faint";

const sectionShell = "scroll-mt-20 py-16 md:py-24";

// Person structured data for search engines — every value comes from
// content.ts. Contact details are deliberately left out of it (machine-read
// markup is the first thing address harvesters parse).
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  description: site.metaDescription,
  sameAs: [site.github, site.linkedin],
  alumniOf: education.map((entry) => ({ "@type": "CollegeOrUniversity", name: entry.school })),
  knowsAbout: skillGroups.map((group) => group.title),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background"
      >
        Skip to content
      </a>
      <Atmosphere />
      <SiteNav />

      <main id="main" className="relative mx-auto w-full max-w-6xl px-6">
        {/* min-h-screen (100vh = LARGE viewport on phones), never the
            dynamic-viewport unit: that one shrinks while the browser toolbar
            is visible, which pulled the projects up to the waterline on iOS
            Safari AND re-laid-out the whole page on every toolbar collapse
            mid-scroll. The scene's waterline is anchored to the large
            viewport — the hero must be sized against the same stable unit.
            (Do not even name the forbidden class in comments: Tailwind scans
            them and would emit the utility, tripping the layout guard.) */}
        <section id="top" className="flex min-h-screen flex-col justify-start pb-24 pt-28 md:pt-32">
          <p className="hero-rise font-mono text-xs uppercase tracking-widest text-accent md:text-sm">
            {site.role}
          </p>
          <h1 className="hero-rise hero-legible mt-4 text-5xl font-semibold tracking-tight text-foreground [animation-delay:70ms] md:text-7xl">
            {site.name}
          </h1>
          <p className="hero-rise hero-legible mt-6 max-w-2xl text-balance text-2xl font-medium text-foreground [animation-delay:140ms] md:text-3xl">
            {site.headline}
          </p>
          <p className="hero-rise hero-legible mt-4 max-w-2xl text-pretty leading-relaxed text-muted [animation-delay:210ms]">
            {site.summary}
          </p>
          <div className="hero-rise mt-8 flex flex-wrap gap-3 [animation-delay:280ms]">
            <a
              href="#projects"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background shadow-[0_0_28px_rgba(103,224,255,0.22)] transition-colors hover:bg-accent-bright"
            >
              See the projects
              <span aria-hidden>↓</span>
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-edge bg-background/55 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
            >
              GitHub
              <span aria-hidden>↗</span>
            </a>
          </div>
        </section>

        <section id="projects" aria-labelledby="projects-title" className={sectionShell}>
          <SectionHeading id="projects" />
          <div className="mt-10 space-y-8">
            {projects.map((project, index) => (
              <ProjectCard key={project.name} project={project} flip={index % 2 === 1} />
            ))}
          </div>
        </section>

        <section id="experience" aria-labelledby="experience-title" className={sectionShell}>
          <SectionHeading id="experience" />
          <ol className="mt-12 max-w-4xl space-y-12 border-l border-edge pl-8">
            {experience.map((job) => (
              <li key={job.company} className="reveal relative">
                <span
                  aria-hidden
                  className="timeline-node absolute -left-[37px] top-2 h-2 w-2 rounded-full border border-accent bg-background"
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {job.role}
                    {/* Phones: the company takes its own line instead of
                        wrapping mid-name. */}
                    <span className="block font-normal text-accent sm:inline">
                      <span aria-hidden className="hidden sm:inline">
                        {" · "}
                      </span>
                      {job.company}
                    </span>
                  </h3>
                  <span className="font-mono text-xs text-faint">{job.period}</span>
                </div>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted">{job.description}</p>
              </li>
            ))}
          </ol>
          <h3 className="mt-14 font-mono text-xs uppercase tracking-widest text-faint">Education</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {education.map((entry) => (
              <div key={entry.school} className="reveal rounded-2xl border border-edge bg-surface p-6">
                <h4 className="font-semibold text-foreground">{entry.degree}</h4>
                <p className="mt-1 text-sm text-accent">{entry.school}</p>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{entry.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="skills" aria-labelledby="skills-title" className={sectionShell}>
          <SectionHeading id="skills" />
          <dl className="reveal mt-10 divide-y divide-edge rounded-2xl border border-edge bg-surface">
            {skillGroups.map((group) => (
              <div key={group.title} className="grid gap-3 p-6 md:grid-cols-[13rem_1fr] md:gap-8">
                <dt className="font-semibold text-foreground">{group.title}</dt>
                <dd className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span key={skill} className={chip}>
                      {skill}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="about" aria-labelledby="about-title" className={sectionShell}>
          <SectionHeading id="about" />
          <div className="reveal mt-10 max-w-3xl space-y-5 text-pretty leading-relaxed text-muted">
            {about.map((paragraph, index) => (
              <p key={paragraph} className={index === 0 ? "text-lg leading-relaxed text-foreground md:text-xl" : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-title" className={sectionShell}>
          <SectionHeading id="contact" />
          <p className="reveal mt-10 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {contact.headline}
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-bright"
            >
              {site.email}
            </a>
            <CopyButton value={site.email} label="Copy address" />
          </div>
          <ul className="reveal mt-8 grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:grid-cols-3">
            <li>
              <a href={`tel:+1${site.phone.replace(/-/g, "")}`} className="contact-tile">
                <span className="contact-tile-label">Phone</span>
                <span>{site.phone}</span>
              </a>
            </li>
            <li>
              <a href={site.github} target="_blank" rel="noreferrer" className="contact-tile">
                <span className="contact-tile-label">GitHub</span>
                <span>
                  {site.githubLabel} <span aria-hidden>↗</span>
                </span>
              </a>
            </li>
            <li>
              <a href={site.linkedin} target="_blank" rel="noreferrer" className="contact-tile">
                <span className="contact-tile-label">LinkedIn</span>
                <span>
                  {site.linkedinLabel} <span aria-hidden>↗</span>
                </span>
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="relative mx-auto w-full max-w-6xl px-6 pb-28">
        <div className="flex flex-col gap-6 border-t border-edge/60 py-10 text-xs text-faint md:flex-row md:items-start md:justify-between">
          <div>
            <p>
              © {new Date().getFullYear()} {site.name} · {footer.tagline}
            </p>
            <p className="mt-1 max-w-xl">{footer.credits}</p>
          </div>
          <a
            href="#top"
            className="inline-flex min-h-11 items-center gap-2 self-start font-mono uppercase tracking-widest text-muted transition-colors hover:text-accent md:min-h-0"
          >
            <span aria-hidden>↑</span> Back to the surface
          </a>
        </div>
      </footer>
    </>
  );
}
