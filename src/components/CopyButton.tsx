"use client";

import { useEffect, useRef, useState } from "react";

// Copies a value to the clipboard and confirms it — a mailto: link is useless
// to anyone on webmail, so the address needs a second way out of the page.
export default function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API refused (insecure context, denied permission): leave
      // the label alone rather than claim a copy that did not happen.
      return;
    }
    setCopied(true);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-edge bg-surface/70 px-5 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copied ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
          </>
        )}
      </svg>
      {/* Polite live region: the confirmation is announced, the idle label is not. */}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
