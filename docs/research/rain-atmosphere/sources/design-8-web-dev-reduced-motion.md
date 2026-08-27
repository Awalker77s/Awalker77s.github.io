# Source: web.dev — prefers-reduced-motion

- URL: https://web.dev/articles/prefers-reduced-motion
- Fetch date: 2026-08-27
- Fetched via: WebFetch

## Verbatim/near-verbatim fragments

> "used to detect if the user has set an operating system preference to minimize the amount of animation or motion it uses"

Values: `no-preference` and `reduce`.

Cited medical rationale: motion-triggered vestibular spectrum disorder can cause "dizziness, nausea, and migraine headaches" from animation like parallax scrolling.

## Code patterns (verbatim)

CSS:
```css
@media (prefers-reduced-motion: reduce) {
  button {
    animation: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  button {
    animation: vibrate 0.3s linear infinite both;
  }
}
```

JS:
```javascript
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
mediaQuery.addEventListener('change', () => {
  console.log(mediaQuery.media, mediaQuery.matches);
  // Stop JavaScript-based animations
});
```

## Recommendations (as extracted)

- Disable decorative effects: parallax scrolling, animated gradients, background animations.
- Pause autoplaying videos.
- Remove reveal/entrance animations while keeping scrolling itself functional.
- Prefer static image variants over animated GIF/WebP where used.
- **Preserve feedback animations that communicate the result of a user action** (this one is the nuance most sites get wrong — reduced motion isn't "zero motion," it's "zero decorative/vestibular-triggering motion").

## Notes for design brief — [confirmed, authoritative primary source]

- Direct, load-bearing for this project: the rain/water-surface background is exactly the class of "decorative background animation" this spec targets. Implementation should wire the CSS media query (and matching JS listener, since a canvas/WebGL rain loop needs a JS-side check, not just CSS) to fully stop or drastically simplify the rain animation — not just slow it down — when `prefers-reduced-motion: reduce` is set, while keeping small feedback animations (button hovers, toggle states) intact.
- Also implies: any manual in-page "pause animation" toggle should be an *addition* to respecting the OS-level setting, not a replacement for it — the OS preference should be the default behavior on load.
