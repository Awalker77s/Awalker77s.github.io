"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Project, ProjectImage } from "@/lib/content";

// Static export ships pre-generated WebP pairs (foo.webp + foo-sm.webp);
// next/image can't emit a srcset under `unoptimized`, so the cards use a
// plain <img> whose srcset lets phones fetch the 800w variant.
const smallVariant = (src: string) => src.replace(/\.webp$/, "-sm.webp");
const srcSetFor = (image: ProjectImage) =>
  `${smallVariant(image.src)} 800w, ${image.src} ${image.width}w`;

// Rendered width of the card's media column: 7 of 12 columns inside the
// max-w-6xl page on desktop, the card minus its padding on small tablets.
// Phones report a deliberately low 266px: at 3x density that asks for 798
// device pixels, which the 800w variant satisfies. An honest ~300px slot
// asks for ~900 and sent every modern phone the full-size file — 2.5x the
// bytes for a difference no one can see at 2.7 device pixels per CSS pixel.
// (The lightbox still loads full size; that is where detail gets read.)
const CARD_SIZES =
  "(min-width: 1152px) 600px, (min-width: 768px) 55vw, (min-width: 520px) calc(100vw - 90px), 266px";
const LIGHTBOX_SIZES = "92vw";

const SWIPE_MIN_PX = 40;

const arrowButton =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-background/70 text-muted backdrop-blur transition-colors hover:border-accent/40 hover:text-accent";

const chip =
  "rounded border border-edge bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-faint";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={direction === "left" ? "M8.5 2.5 4 7l4.5 4.5" : "M5.5 2.5 10 7l-4.5 4.5"} />
    </svg>
  );
}

export default function ProjectCard({ project, flip }: { project: Project; flip: boolean }) {
  const images = project.images;
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  // Mobile-only: the wordy half of the card starts collapsed to image +
  // tagline; this never affects md+ where the details are always shown.
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Neighbouring gallery images are fetched only once the visitor shows
  // interest in this card — never for the eight cards they scroll past.
  const [engaged, setEngaged] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const detailsId = `${slug}-details`;
  const metaId = `${slug}-meta`;
  // The type doesn't forbid an empty images[] — a project without images
  // renders its text half instead of crashing the card.
  const current = count > 0 ? images[Math.min(index, count - 1)] : undefined;
  // One stage per card, shaped to the card's TALLEST image: paging between
  // screenshots of different proportions letterboxes inside the stage instead
  // of changing the card's height (which shoved the page under the reader's
  // thumb on phones).
  const stageRatio = count > 0 ? Math.min(...images.map((image) => image.width / image.height)) : 1.6;

  const step = useCallback(
    (delta: number) => {
      setEngaged(true);
      setIndex((previous) => (previous + delta + count) % count);
    },
    [count],
  );

  // Warm the images either side of the current one so paging is instant.
  // Same srcset/sizes as the visible <img>, so the browser picks (and caches)
  // exactly the candidate it will be asked for.
  useEffect(() => {
    if (!engaged || count < 2) return;
    for (const delta of [1, -1]) {
      const neighbour = images[(index + delta + count) % count];
      const probe = new Image();
      probe.sizes = expanded ? LIGHTBOX_SIZES : CARD_SIZES;
      probe.srcset = srcSetFor(neighbour);
    }
  }, [engaged, expanded, index, count, images]);

  // The lightbox is a native modal <dialog>: top layer (immune to ancestor
  // transforms and stacking), the page behind goes inert, focus is trapped
  // inside and returns to the opening button on close, Escape closes it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  // While the lightbox is open, freeze page scroll (the wheel smoother writes
  // scrollTo, which no-ops under overflow:hidden) — and always restore it.
  useEffect(() => {
    if (!expanded) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [expanded]);

  function onGalleryKey(event: React.KeyboardEvent) {
    if (count < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  }

  // Touch swipe pages the gallery. The stage sets touch-action: pan-y, so
  // vertical drags stay the browser's (page scroll) and arrive here as
  // pointercancel; only sideways drags complete as pointerup.
  function onSwipeStart(event: React.PointerEvent) {
    setEngaged(true);
    swiped.current = false;
    swipeStart.current = event.pointerType === "touch" && count > 1 ? { x: event.clientX, y: event.clientY } : null;
  }
  function onSwipeEnd(event: React.PointerEvent) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    // The click that follows this pointerup must not open the lightbox.
    swiped.current = true;
    step(dx < 0 ? 1 : -1);
  }
  function onStageClick() {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    setExpanded(true);
  }

  const mediaColumns = flip ? "md:col-start-6 md:col-end-13" : "md:col-start-1 md:col-end-8";
  const textColumns = flip ? "md:col-start-1 md:col-end-6" : "md:col-start-8 md:col-end-13";

  return (
    <article className="project-card reveal rounded-2xl border border-edge bg-surface p-5 transition-colors hover:border-accent/25 md:grid md:grid-cols-12 md:grid-rows-[auto_1fr] md:gap-x-10 md:p-8">
      {current && (
        <div
          className={`relative overflow-hidden rounded-lg border border-edge bg-stage ${mediaColumns} md:row-start-1`}
          style={{ aspectRatio: stageRatio }}
          onPointerEnter={() => setEngaged(true)}
          onFocus={() => setEngaged(true)}
        >
          <button
            type="button"
            onClick={onStageClick}
            onKeyDown={onGalleryKey}
            onPointerDown={onSwipeStart}
            onPointerUp={onSwipeEnd}
            onPointerCancel={() => (swipeStart.current = null)}
            aria-label={`Expand ${project.name} image`}
            className="stage-button block h-full w-full cursor-zoom-in touch-pan-y"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              srcSet={srcSetFor(current)}
              sizes={CARD_SIZES}
              alt={current.alt}
              width={current.width}
              height={current.height}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-contain"
            />
          </button>
          {count > 1 && (
            <>
              <div className="screen-only pointer-events-none absolute inset-y-0 left-2 right-2 flex items-center justify-between">
                <button type="button" onClick={() => step(-1)} aria-label="Previous image" className={arrowButton}>
                  <Chevron direction="left" />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next image" className={arrowButton}>
                  <Chevron direction="right" />
                </button>
              </div>
              <span className="screen-only pointer-events-none absolute bottom-2 right-3 rounded-full border border-edge bg-background/70 px-2 py-0.5 font-mono text-[10px] text-faint backdrop-blur">
                {index + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}

      <div className={`mt-5 md:mt-0 ${textColumns} md:row-span-2 md:row-start-1`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{project.name}</h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
              project.badge === "live" ? "border-accent/40 text-accent" : "border-edge text-faint"
            }`}
          >
            {project.badge === "live" && <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />}
            {project.badge}
          </span>
        </div>
        <p className="mt-1.5 font-mono text-sm text-accent">{project.tagline}</p>
        <button
          type="button"
          onClick={() => setDetailsOpen((previous) => !previous)}
          aria-expanded={detailsOpen}
          aria-controls={`${detailsId} ${metaId}`}
          className="screen-only mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-edge bg-surface-raised px-4 font-mono text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent md:hidden"
        >
          {detailsOpen ? "Hide details" : "Expand project"}
          <span aria-hidden>{detailsOpen ? "▴" : "▾"}</span>
        </button>
        <div id={detailsId} className={`${detailsOpen ? "block" : "hidden"} md:block`}>
          <p className="mt-4 text-sm leading-relaxed text-muted">{project.description}</p>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
            {project.points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stack + links sit under the screenshot on desktop (a caption strip
          that balances the two columns) and close out the expanded details on
          phones. */}
      <div
        id={metaId}
        className={`${detailsOpen ? "block" : "hidden"} mt-5 md:block ${mediaColumns} md:row-start-2`}
      >
        <ul className="flex flex-wrap gap-2" aria-label="Built with">
          {project.stack.map((tech) => (
            <li key={tech} className={chip}>
              {tech}
            </li>
          ))}
        </ul>
        {(project.repoUrl || project.note) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center font-medium text-foreground transition-colors hover:text-accent md:min-h-0"
              >
                GitHub ↗
              </a>
            )}
            {project.note && <span className="text-faint">{project.note}</span>}
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`${project.name} image viewer`}
        onClose={() => setExpanded(false)}
        onClick={(event) => {
          // Only a press on the backdrop itself (not the image or controls).
          if (event.target === event.currentTarget) setExpanded(false);
        }}
        onKeyDown={onGalleryKey}
        className="lightbox m-0 h-full max-h-none w-full max-w-none flex-col items-center justify-center bg-transparent p-4 text-foreground backdrop:bg-black/90 open:flex"
      >
        {expanded && current && (
          <>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close image viewer"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-background/70 text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
              </svg>
            </button>
            <figure className="flex max-h-full max-w-full flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.src}
                srcSet={srcSetFor(current)}
                sizes={LIGHTBOX_SIZES}
                alt={current.alt}
                width={current.width}
                height={current.height}
                decoding="async"
                className="h-auto max-h-[80vh] w-auto max-w-[92vw] rounded-lg border border-edge object-contain"
              />
              <figcaption className="mt-3 max-w-3xl text-center text-xs leading-relaxed text-muted">
                {current.alt}
              </figcaption>
              {count > 1 && (
                <div className="mt-3 flex items-center gap-4">
                  <button type="button" onClick={() => step(-1)} aria-label="Previous image" className={arrowButton}>
                    <Chevron direction="left" />
                  </button>
                  <span className="font-mono text-xs text-faint">
                    {index + 1} / {count}
                  </span>
                  <button type="button" onClick={() => step(1)} aria-label="Next image" className={arrowButton}>
                    <Chevron direction="right" />
                  </button>
                </div>
              )}
            </figure>
          </>
        )}
      </dialog>
    </article>
  );
}
