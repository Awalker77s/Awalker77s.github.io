"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/lib/content";

const arrowButton =
  "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-background/70 text-lg leading-none text-muted backdrop-blur transition-colors hover:border-accent/40 hover:text-accent";

export default function ProjectCard({ project, flip }: { project: Project; flip: boolean }) {
  const images = project.images;
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const current = images[Math.min(index, count - 1)];

  const step = useCallback(
    (delta: number) => setIndex((previous) => (previous + delta + count) % count),
    [count],
  );

  // While the lightbox is open: freeze page scroll (the wheel smoother
  // writes scrollTo, which no-ops under overflow:hidden) and take over the
  // keyboard for navigation.
  useEffect(() => {
    if (!expanded) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded, step]);

  return (
    <article
      className={`flex flex-col gap-8 rounded-xl border border-edge bg-surface p-6 md:items-center md:p-8 ${
        flip ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <div className="relative md:w-1/2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={`Expand ${project.name} image`}
          className="block w-full cursor-zoom-in"
        >
          <Image
            src={current.src}
            alt={current.alt}
            width={current.width}
            height={current.height}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="w-full rounded-lg border border-edge"
          />
        </button>
        {count > 1 && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-2 right-2 flex items-center justify-between">
              <button type="button" onClick={() => step(-1)} aria-label="Previous image" className={arrowButton}>
                ‹
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next image" className={arrowButton}>
                ›
              </button>
            </div>
            <span className="absolute bottom-2 right-3 rounded-full border border-edge bg-background/70 px-2 py-0.5 font-mono text-[10px] text-faint backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        )}
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

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${project.name} image viewer`}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
          onWheel={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-background/70 text-lg text-muted transition-colors hover:text-accent"
          >
            ✕
          </button>
          <div className="flex max-h-full max-w-full flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <Image
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="92vw"
              className="h-auto max-h-[82vh] w-auto max-w-[92vw] rounded-lg border border-edge object-contain"
            />
            <p className="mt-3 max-w-3xl text-center text-xs leading-relaxed text-muted">{current.alt}</p>
            {count > 1 && (
              <div className="mt-3 flex items-center gap-4">
                <button type="button" onClick={() => step(-1)} aria-label="Previous image" className={arrowButton}>
                  ‹
                </button>
                <span className="font-mono text-xs text-faint">
                  {index + 1} / {count}
                </span>
                <button type="button" onClick={() => step(1)} aria-label="Next image" className={arrowButton}>
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
