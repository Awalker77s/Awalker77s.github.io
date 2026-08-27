import Atmosphere from "@/components/Atmosphere";
import ProjectCard from "@/components/ProjectCard";
import { site, projects, collaboration, experience, education, skillGroups, about } from "@/lib/content";

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <h2 className="font-mono text-sm uppercase tracking-widest text-accent">
      <span className="text-faint">{index} — </span>
      {title}
    </h2>
  );
}

const chip =
  "rounded border border-edge bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-faint";

export default function Home() {
  return (
    <>
      <Atmosphere />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-edge/60 bg-background/60 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <a href="#" className="font-semibold text-foreground">
            {site.name}
          </a>
          <div className="hidden gap-6 text-sm text-faint md:flex">
            <a href="#work" className="transition-colors hover:text-foreground">work</a>
            <a href="#experience" className="transition-colors hover:text-foreground">experience</a>
            <a href="#skills" className="transition-colors hover:text-foreground">skills</a>
            <a href="#about" className="transition-colors hover:text-foreground">about</a>
            <a href="#contact" className="transition-colors hover:text-foreground">contact</a>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-5xl px-6">
        <section className="flex min-h-screen flex-col justify-center py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-accent md:text-sm">
            {site.role}
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
            {site.name}
          </h1>
          <p className="mt-6 max-w-2xl text-2xl font-medium text-foreground md:text-3xl">
            {site.headline}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">{site.summary}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#work"
              className="rounded-full border border-accent/40 px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
            >
              See the work ↓
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-edge px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              GitHub ↗
            </a>
          </div>
        </section>

        <section id="work" className="scroll-mt-20 py-16 md:py-24">
          <SectionHeading index="01" title="Work" />
          <div className="mt-8 space-y-8">
            {projects.map((project, index) => (
              <ProjectCard key={project.name} project={project} flip={index % 2 === 1} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-edge bg-surface-raised px-6 py-5">
            <p className="max-w-3xl text-sm leading-relaxed text-muted">
              <span className="font-semibold text-foreground">{collaboration.name} · </span>
              {collaboration.text}
            </p>
            <a
              href={collaboration.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-accent hover:underline"
            >
              GitHub ↗
            </a>
          </div>
        </section>

        <section id="experience" className="scroll-mt-20 py-16 md:py-24">
          <SectionHeading index="02" title="Experience" />
          <ol className="mt-10 space-y-10 border-l border-edge pl-8">
            {experience.map((job) => (
              <li key={job.company} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[37px] top-1.5 h-2 w-2 rounded-full border border-accent bg-background"
                />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-semibold text-foreground">{job.role}</h3>
                  <span className="text-sm text-accent">{job.company}</span>
                  <span className="font-mono text-xs text-faint">{job.period}</span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                  {job.description}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-xl border border-edge bg-surface p-6">
            <h3 className="font-semibold text-foreground">{education.degree}</h3>
            <p className="mt-1 text-sm text-accent">{education.school}</p>
            <p className="mt-2 text-sm text-muted">{education.detail}</p>
          </div>
        </section>

        <section id="skills" className="scroll-mt-20 py-16 md:py-24">
          <SectionHeading index="03" title="Skills" />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {skillGroups.map((group) => (
              <div key={group.title} className="rounded-xl border border-edge bg-surface p-6">
                <h3 className="font-semibold text-foreground">{group.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span key={skill} className={chip}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="scroll-mt-20 py-16 md:py-24">
          <SectionHeading index="04" title="About" />
          <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-muted">
            {about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 py-16 md:py-24">
          <SectionHeading index="05" title="Contact" />
          <p className="mt-8 max-w-2xl text-2xl font-medium text-foreground">
            Building something where AI agents should be doing the work? Let&apos;s talk.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
            <a href={`mailto:${site.email}`} className="text-accent hover:underline">
              {site.email}
            </a>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors hover:text-accent"
            >
              github.com/Awalker77s ↗
            </a>
          </div>
        </section>

        <footer className="border-t border-edge/60 py-10 pb-44 text-xs text-faint">
          <p>© 2026 {site.name} · built in the rain</p>
          <p className="mt-1">
            Rain: custom canvas engine. Sound: synthesized in the Web Audio API. No libraries, no
            recordings.
          </p>
        </footer>
      </main>
    </>
  );
}
