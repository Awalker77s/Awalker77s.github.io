"use client";

import { useEffect, useRef, useState } from "react";
import { createRainEngine, type RainEngine } from "@/lib/rain/engine";
import { createAtmosphereAudio, type AtmosphereAudio } from "@/lib/rain/audio";
import { initSmoothScroll } from "@/lib/scroll";
import { blimpSkills } from "@/lib/content";

const MOTION_KEY = "rain-motion";
const SOUND_KEY = "rain-sound";

export default function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RainEngine | null>(null);
  const audioRef = useRef<AtmosphereAudio | null>(null);
  const depthRef = useRef(0);
  const [motionOn, setMotionOn] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  function enableSound() {
    audioRef.current ??= createAtmosphereAudio();
    audioRef.current.setDepth(depthRef.current);
    setSoundOn(true);
    return audioRef.current.enable();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createRainEngine(
      canvas,
      (depth) => {
        depthRef.current = depth;
        document.documentElement.style.setProperty("--depth", depth.toFixed(3));
        audioRef.current?.setDepth(depth);
      },
      blimpSkills,
    );
    engineRef.current = engine;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stored = localStorage.getItem(MOTION_KEY);
    setMotionOn(stored ? stored === "on" : !reducedMotion.matches);

    const followPreference = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem(MOTION_KEY)) setMotionOn(!event.matches);
    };
    reducedMotion.addEventListener("change", followPreference);

    return () => {
      reducedMotion.removeEventListener("change", followPreference);
      engine.destroy();
      engineRef.current = null;
      audioRef.current?.destroy();
      audioRef.current = null;
      document.documentElement.style.removeProperty("--depth");
    };
  }, []);

  // Sound defaults ON — only an explicit "off" keeps the site silent. Autoplay
  // policy still demands a user gesture before audio may become audible, and no
  // engine counts wheel/scroll as one (Chrome documents its unlock list —
  // pointer, key, touch — and scroll is excluded everywhere). So the pill
  // lights immediately (intent) and the qualifying gesture kinds stay armed
  // until one actually gets the context running (a blocked resume() just stays
  // pending, so detaching on the first attempt would strand the music).
  useEffect(() => {
    if (localStorage.getItem(SOUND_KEY) === "off") return;
    setSoundOn(true);
    const events = ["pointerdown", "keydown", "touchend"] as const;
    let detached = false;
    const detach = () => {
      if (detached) return;
      detached = true;
      for (const name of events) window.removeEventListener(name, tryStart);
    };
    const tryStart = (event: Event) => {
      // The music pill owns its own clicks — if the armed listener also fired
      // on them, it would start the audio and the button's toggle handler,
      // running right after, would see it running and switch it straight off.
      const target = event.target;
      if (target instanceof Element && target.closest('[aria-label="Toggle background music"]')) return;
      // Some engines reject a blocked resume() instead of leaving it pending —
      // either way the listeners stay armed for the next gesture.
      void enableSound().then(detach, () => {});
    };
    for (const name of events) window.addEventListener(name, tryStart, { passive: true });
    // Optimistic zero-gesture start: engines grant audible autoplay to some
    // visitors (Chrome's media-engagement history, installed PWAs) — attempt a
    // resume on arrival and let the score begin with no interaction at all.
    // Blocked attempts stay pending or reject, and the armed gestures above
    // still catch the first touch/key. Deferred a beat so graph construction
    // never competes with first paint.
    const optimistic = window.setTimeout(() => {
      void enableSound().then(detach, () => {});
    }, 600);
    return () => {
      window.clearTimeout(optimistic);
      detach();
    };
  }, []);

  useEffect(() => initSmoothScroll(), []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (motionOn) {
      engine.start();
    } else {
      engine.stop();
      engine.renderStaticFrame();
    }
  }, [motionOn]);

  function toggleSound() {
    // A lit pill whose context never started (visitor scrolled, never clicked —
    // scroll can't unlock audio) means this click is their first qualifying
    // gesture: START the music they were promised instead of toggling it off.
    if (soundOn && !audioRef.current?.isRunning()) {
      localStorage.setItem(SOUND_KEY, "on");
      void enableSound();
      return;
    }
    if (soundOn) {
      audioRef.current?.disable();
      setSoundOn(false);
      localStorage.setItem(SOUND_KEY, "off");
    } else {
      localStorage.setItem(SOUND_KEY, "on");
      void enableSound();
    }
  }

  function toggleMotion() {
    const next = !motionOn;
    setMotionOn(next);
    localStorage.setItem(MOTION_KEY, next ? "on" : "off");
  }

  const pill =
    "flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur transition-colors";
  const pillOn = "border-accent/40 bg-surface/80 text-accent";
  const pillOff = "border-edge bg-surface/80 text-faint hover:text-muted";

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full bg-background" />
      <div className="fixed bottom-5 right-5 z-40 flex gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label="Toggle background music"
          className={`${pill} ${soundOn ? pillOn : pillOff}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            {soundOn ? (
              <>
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
              </>
            ) : (
              <>
                <line x1="16" y1="9" x2="22" y2="15" />
                <line x1="22" y1="9" x2="16" y2="15" />
              </>
            )}
          </svg>
          music
        </button>
        <button
          type="button"
          onClick={toggleMotion}
          aria-pressed={motionOn}
          aria-label="Toggle rain animation"
          className={`${pill} ${motionOn ? pillOn : pillOff}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.7c3.3 4.1 6 7.6 6 11a6 6 0 1 1-12 0c0-3.4 2.7-6.9 6-11z" />
          </svg>
          rain
        </button>
      </div>
    </>
  );
}
