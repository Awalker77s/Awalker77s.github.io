"use client";

import { useCallback, useEffect, useRef } from "react";
import { createRainEngine, type RainEngine } from "@/lib/rain/engine";
import { createAtmosphereAudio, type AtmosphereAudio } from "@/lib/rain/audio";
import { initSmoothScroll } from "@/lib/scroll";
import { emitDepth } from "@/lib/depth";
import { removeStoredKey, useStoredFlag, writeStoredFlag } from "@/lib/storedFlag";
import { blimpSkills } from "@/lib/content";

const MOTION_KEY = "rain-motion-v2";
const SOUND_KEY = "rain-sound";
const MUSIC_LABEL = "Toggle background music";

export default function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RainEngine | null>(null);
  const audioRef = useRef<AtmosphereAudio | null>(null);
  const depthRef = useRef(0);
  // Rain starts ON for everyone — it's the site's identity (operator call
  // 2026-08-31). The OS reduced-motion preference does not pre-disable it
  // (that quietly parked some visitors on a frozen frame); the pill is the
  // opt-out, and only an explicit stored "off" keeps the scene still.
  const motionOn = useStoredFlag(MOTION_KEY);
  // Sound defaults ON too — the pill lights immediately (intent); see the
  // arming effect below for when it can actually become audible.
  const soundOn = useStoredFlag(SOUND_KEY);

  const enableSound = useCallback(() => {
    audioRef.current ??= createAtmosphereAudio();
    audioRef.current.setDepth(depthRef.current);
    return audioRef.current.enable();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const depthCanvas = depthCanvasRef.current;
    if (!canvas || !depthCanvas) return;
    const engine = createRainEngine(
      canvas,
      depthCanvas,
      (depth) => {
        depthRef.current = depth;
        document.documentElement.style.setProperty("--depth", depth.toFixed(3));
        audioRef.current?.setDepth(depth);
        emitDepth(depth);
      },
      blimpSkills,
    );
    engineRef.current = engine;

    // The motion key is versioned because the old key collected "off" values
    // under the old reduced-motion scheme — clear it so those can't keep
    // returning visitors rainless.
    removeStoredKey("rain-motion");

    return () => {
      engine.destroy();
      engineRef.current = null;
      audioRef.current?.destroy();
      audioRef.current = null;
      document.documentElement.style.removeProperty("--depth");
      emitDepth(0);
    };
  }, []);

  // Autoplay policy demands a user gesture before audio may become audible,
  // and no engine counts wheel/scroll as one (Chrome documents its unlock
  // list — pointer, key, touch — and scroll is excluded everywhere). So the
  // qualifying gesture kinds stay armed until one actually gets the context
  // running (a blocked resume() just stays pending, so detaching on the first
  // attempt would strand the music).
  useEffect(() => {
    if (!soundOn) return;
    const events = ["pointerdown", "keydown", "touchend"] as const;
    let armed = false;
    const disarm = () => {
      if (!armed) return;
      armed = false;
      for (const name of events) window.removeEventListener(name, onGesture);
    };
    // Some engines reject a blocked resume() instead of leaving it pending —
    // either way the listeners stay armed for the next gesture.
    const start = () => {
      // Never start in a background tab; the visibility handler below starts
      // the score when the visitor actually arrives.
      if (document.hidden) return;
      void enableSound().then(disarm, () => {});
    };
    function onGesture(event: Event) {
      // The music pill owns its own clicks — if the armed listener also fired
      // on them, it would start the audio and the button's toggle handler,
      // running right after, would see it running and switch it straight off.
      const target = event.target;
      if (target instanceof Element && target.closest(`[aria-label="${MUSIC_LABEL}"]`)) return;
      start();
    }
    const arm = () => {
      if (armed) return;
      armed = true;
      for (const name of events) window.addEventListener(name, onGesture, { passive: true });
    };
    arm();
    // Optimistic zero-gesture start: engines grant audible autoplay to some
    // visitors (Chrome's media-engagement history, installed PWAs) — attempt a
    // resume on arrival and let the score begin with no interaction at all.
    // Blocked attempts stay pending or reject, and the armed gestures above
    // still catch the first touch/key. Deferred a beat so graph construction
    // never competes with first paint.
    const optimistic = window.setTimeout(start, 600);
    // The score is ambience for the page being read: it fades out when the
    // tab goes to the background (nobody should have to hunt for the tab
    // that is still playing) and returns with it. The stored preference is
    // untouched — this is a pause, not an opt-out.
    const onVisibility = () => {
      if (document.hidden) {
        audioRef.current?.disable();
      } else {
        arm();
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(optimistic);
      document.removeEventListener("visibilitychange", onVisibility);
      disarm();
    };
  }, [soundOn, enableSound]);

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
      writeStoredFlag(SOUND_KEY, true);
      void enableSound().catch(() => {});
      return;
    }
    if (soundOn) {
      audioRef.current?.disable();
      writeStoredFlag(SOUND_KEY, false);
    } else {
      writeStoredFlag(SOUND_KEY, true);
      void enableSound().catch(() => {});
    }
  }

  function toggleMotion() {
    writeStoredFlag(MOTION_KEY, !motionOn);
  }

  // Phones get icon-only 44px circles (the labelled pair covered a third of
  // the screen width over the content); the words return from sm up.
  const pill =
    "flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border text-xs font-medium backdrop-blur transition-colors sm:px-4";
  const pillOn = "border-accent/40 bg-surface/80 text-accent";
  const pillOff = "border-edge bg-surface/80 text-faint hover:text-muted";

  return (
    <>
      {/* Scene: in the document flow — the browser scrolls it with the text.
          Depth: fixed viewport ambience (abyss/rays/snow), transparent at the
          surface, stacked over the scene and under the content. */}
      <canvas ref={canvasRef} aria-hidden className="scene-doc-canvas pointer-events-none bg-background" />
      <canvas ref={depthCanvasRef} aria-hidden className="scene-canvas pointer-events-none fixed left-0 top-0 -z-10 w-full" />
      <div className="atmosphere-controls fixed bottom-5 right-5 z-40 flex gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={MUSIC_LABEL}
          title={soundOn ? "Music on" : "Music off"}
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
          <span className="hidden sm:inline">music</span>
        </button>
        <button
          type="button"
          onClick={toggleMotion}
          aria-pressed={motionOn}
          aria-label="Toggle rain animation"
          title={motionOn ? "Rain on" : "Rain off"}
          className={`${pill} ${motionOn ? pillOn : pillOff}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2.7c3.3 4.1 6 7.6 6 11a6 6 0 1 1-12 0c0-3.4 2.7-6.9 6-11z" />
          </svg>
          <span className="hidden sm:inline">rain</span>
        </button>
      </div>
    </>
  );
}
