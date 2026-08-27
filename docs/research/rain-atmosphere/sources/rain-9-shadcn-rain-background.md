# Source: shadcn.io React Rain Background

- URL: https://www.shadcn.io/background/rain
- Fetch date: 2026-08-27
- License: not stated on page (GAP)
- Last update: not shown (GAP)

## Verbatim/close quoted fragments
> "Canvas-based for smooth performance even with hundreds of drops."
> distant drops are "slower and dimmer," close ones are "fast and bright" [parallax depth layering]
> Optional lightning flash illumination feature mentioned (page markets it toward "lo-fi aesthetics, weather apps, moody landing pages")

## Technique / scope
Canvas-2D, explicitly built for React/Next.js integration (component-shaped, shadcn.io ecosystem mirrors shadcn/ui's copy-paste-component distribution model). Renders falling rain with parallax depth layers only — no water surface, no ripple/splash system. No actual component source code was visible in the fetched page (preview section collapsed behind "Scroll to load preview"; likely requires JS execution to reveal code, which is a fetch limitation of this tool, not confirmation the code doesn't exist).

## Confidence and relevance
[single-source, partial — code itself unverified]. This does NOT satisfy the water-surface-with-ripples requirement (Falsifiable Question 2: NO) but IS valuable as a structural/architectural reference for Falsifiable Question 1 and the INTEGRATION NOTES: it independently corroborates that canvas-2D (not WebGL) is the standard approach for a React/Next.js-embeddable, DOM-compatible, parallax-layered rain background aimed at "moody" aesthetics — i.e., the falling-rain half of the brief is commonly solved with plain canvas-2D in exactly this DOM-integration context, consistent with the recommendation to pair canvas-2D rain with a canvas-2D (not WebGL) spring water surface.
