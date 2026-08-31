"use client";

import { useEffect, useRef, useState } from "react";
import { createRainEngine, type RainEngine } from "@/lib/rain/engine";
import { createRainAudio, type RainAudio } from "@/lib/rain/audio";

const MOTION_KEY = "rain-motion";
const SOUND_KEY = "rain-sound";

export default function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RainEngine | null>(null);
  const audioRef = useRef<RainAudio | null>(null);
  const depthRef = useRef(0);
  const [motionOn, setMotionOn] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  function enableSound() {
    audioRef.current ??= createRainAudio();
    audioRef.current.setDepth(depthRef.current);
    setSoundOn(true);
    return audioRef.current.enable();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createRainEngine(canvas, (depth) => {
      depthRef.current = depth;
      document.documentElement.style.setProperty("--depth", depth.toFixed(3));
      audioRef.current?.setDepth(depth);
    });
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

  // A stored "on" preference still needs a user gesture before audio may
  // become audible (Chrome autoplay policy), so arm a one-time listener.
  useEffect(() => {
    if (localStorage.getItem(SOUND_KEY) !== "on") return;
    const resumeOnFirstGesture = () => void enableSound();
    window.addEventListener("pointerdown", resumeOnFirstGesture, { once: true });
    return () => window.removeEventListener("pointerdown", resumeOnFirstGesture);
  }, []);

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
    "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur transition-colors";
  const pillOn = "border-accent/40 bg-surface/80 text-accent";
  const pillOff = "border-edge bg-surface/80 text-faint hover:text-muted";

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="fixed inset-0 -z-10 h-full w-full" />
      <div className="fixed bottom-5 right-5 z-40 flex gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label="Toggle rain sound"
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
          sound
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
