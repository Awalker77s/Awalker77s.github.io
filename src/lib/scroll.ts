// Wheel and paging-key input moves the page in discrete notches (a Windows
// mouse wheel steps ~100px per detent) while the rain engine's camera eases
// toward scroll at ~8/s — so the DOM visibly steps against a gliding scene.
// This intercepts wheel + paging keys and eases window scroll through the same
// exponential curve, so page and scene travel together. Touch flings,
// scrollbar drags, and anchor navigation stay native.

const EASE_RATE = 8; // s^-1 — matches the engine's camera blend in updateDepth
const SETTLE_PX = 0.5;
const LINE_PX = 40; // wheel deltaMode LINE → pixels
const ARROW_PX = 64;
const PAGE_FRACTION = 0.85;

function attach(): () => void {
  let target = window.scrollY;
  let current = window.scrollY;
  let lastApplied = window.scrollY;
  let raf = 0;
  let lastTime = 0;

  const maxScroll = () =>
    Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  const clampTarget = () => {
    target = Math.min(Math.max(target, 0), maxScroll());
  };

  function step(time: number) {
    // rAF timestamps mark the frame's start, which can precede the
    // performance.now() glideBy captured mid-frame — an unclamped negative dt
    // flips the ease fraction and jerks the page backward on glide start.
    const dt = Math.min(Math.max((time - lastTime) / 1000, 0), 0.1);
    lastTime = time;
    // Adopt outside motion (anchor navigation, scrollbar drags, scripts) into
    // both cursors so resuming the glide never snaps back.
    const drift = window.scrollY - lastApplied;
    current += drift;
    target += drift;
    clampTarget();
    current += (target - current) * (1 - Math.exp(-dt * EASE_RATE));
    if (Math.abs(target - current) < SETTLE_PX) {
      current = target;
      raf = 0;
    } else {
      raf = requestAnimationFrame(step);
    }
    // "instant" sidesteps the CSS scroll-behavior: smooth on <html>, which
    // would otherwise animate every per-frame write and fight this loop.
    window.scrollTo({ top: current, behavior: "instant" });
    lastApplied = window.scrollY;
  }

  function glideBy(delta: number) {
    if (!raf) {
      current = window.scrollY;
      lastApplied = current;
      target = current;
      lastTime = performance.now();
      raf = requestAnimationFrame(step);
    }
    target += delta;
    clampTarget();
  }

  function glideTo(top: number) {
    glideBy(0);
    target = top;
    clampTarget();
  }

  function onWheel(event: WheelEvent) {
    if (event.ctrlKey || event.defaultPrevented) return; // pinch-zoom / handled
    const scale =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? LINE_PX
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? window.innerHeight
          : 1;
    event.preventDefault();
    glideBy(event.deltaY * scale);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
    // Only when the page itself has focus — a focused control keeps native
    // Space/Enter activation and arrow handling.
    if (event.target !== document.body && event.target !== document.documentElement) return;
    if (event.shiftKey && event.key !== " ") return;
    switch (event.key) {
      case "ArrowDown":
        glideBy(ARROW_PX);
        break;
      case "ArrowUp":
        glideBy(-ARROW_PX);
        break;
      case "PageDown":
        glideBy(window.innerHeight * PAGE_FRACTION);
        break;
      case "PageUp":
        glideBy(-window.innerHeight * PAGE_FRACTION);
        break;
      case " ":
        glideBy(window.innerHeight * PAGE_FRACTION * (event.shiftKey ? -1 : 1));
        break;
      case "Home":
        glideTo(0);
        break;
      case "End":
        glideTo(maxScroll());
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
}

// Smoothing is a motion effect: reduced-motion users keep native scrolling,
// and a live preference change attaches or detaches on the spot.
export function initSmoothScroll(): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let detach: (() => void) | null = null;
  const sync = () => {
    if (media.matches) {
      detach?.();
      detach = null;
    } else {
      detach ??= attach();
    }
  };
  sync();
  media.addEventListener("change", sync);
  return () => {
    media.removeEventListener("change", sync);
    detach?.();
    detach = null;
  };
}
