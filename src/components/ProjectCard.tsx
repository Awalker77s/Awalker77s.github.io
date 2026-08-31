import Image from "next/image";
import type { Project } from "@/lib/content";

export default function ProjectCard({ project, flip }: { project: Project; flip: boolean }) {
  return (
    <article
      className={`flex flex-col gap-8 rounded-xl border border-edge bg-surface p-6 md:items-center md:p-8 ${
        flip ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <div className="md:w-1/2">
        {project.terminal ? (
          <div className="rounded-lg border border-edge bg-background/80 p-5 font-mono text-xs leading-relaxed text-muted">
            {project.terminal.map((line) => (
              <div key={line} className={line.startsWith("$") ? "text-accent" : undefined}>
                {line}
              </div>
            ))}
          </div>
        ) : project.image ? (
          <Image
            src={project.image.src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="w-full rounded-lg border border-edge"
          />
        ) : null}
      </div>
      <div className="md:w-1/2">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
              project.badge === "live" ? "border-accent/40 text-accent" : "border-edge text-faint"
            }`}
          >
            {project.badge}
          </span>
        </div>
        <p className="mt-1 font-mono text-sm text-accent">{project.tagline}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{project.description}</p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          {project.points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded border border-edge bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-faint"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Visit live ↗
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:text-accent"
            >
              GitHub ↗
            </a>
          )}
          {project.note && <span className="text-faint">{project.note}</span>}
        </div>
      </div>
    </article>
  );
}
