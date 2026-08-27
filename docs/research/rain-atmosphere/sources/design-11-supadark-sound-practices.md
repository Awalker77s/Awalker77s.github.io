# Source: Supadark — "5 Best Practices for Designing Web Sound Effects"

- URL: https://supadark.com/notes/5-best-practices-for-designing-web-sound-effects
- Fetch date: 2026-08-27
- Fetched via: WebFetch

## Verbatim fragments

> "Ambient sounds should be off by default."

> "Clear Mute Button: Easily discoverable on every page where sound might play" / "Volume Control: Allows users to adjust the sound."

> "If a user mutes the sound, remember it for the session."

> "Chrome, Safari, and Firefox all block audio until the user interacts with the page." — i.e. autoplay-with-sound is not just bad practice, it is largely technically blocked by browsers now.

> Recommended pattern: treat "the first user gesture (a click on a clearly labelled sound toggle) as the moment audio switches on, and to store that preference."

> "Autoplaying sound is a major UX faux pas. Users might be in a quiet environment or already listening to audio."

## Notes for design brief — [confirmed, single-source for these exact quotes; consistent with general browser-autoplay-policy knowledge, which is well-established and cross-checked by the technical claim about Chrome/Safari/Firefox blocking behavior]

Concrete sound-toggle spec for the portfolio, synthesized directly from this source:

1. **Default state: OFF.** Ambient rain/rain-on-water audio must not play until the visitor explicitly opts in — both as good practice and because browsers block unrequested autoplay-with-sound outright.
2. **The toggle itself is the opt-in gesture** — clicking a labeled sound icon both starts the audio and records the preference in the same action (no separate "are you sure" step).
3. **Persist the choice for the session** (localStorage/sessionStorage), so it doesn't reset on every route change within a single-page portfolio.
4. **Placement:** fixed, always-visible, same discoverability tier as a light/dark toggle — not buried in a menu.
5. **Label state clearly** (icon + accessible label swap, e.g. "Sound on"/"Sound off" via aria-pressed) — this pairs with the Bruno Simon precedent (design-4) of a first-class, visible audio toggle on an atmosphere-heavy personal site.
