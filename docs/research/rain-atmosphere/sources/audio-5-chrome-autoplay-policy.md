# Source: Chrome for Developers — Autoplay Policy in Chrome

- URL: https://developer.chrome.com/blog/autoplay
- Fetched: 2026-08-27
- Publication date: not visible in the fetch output (this is Chrome's long-standing, periodically-updated autoplay policy post; treat date as unconfirmed — see gap note)
- Fetch method: WebFetch (not a browser tool)

## Verbatim quoted fragments

Muted autoplay:
> "Muted autoplay is always allowed."

Autoplay-with-sound conditions (any ONE of):
> "The user has interacted with the domain (click, tap, etc.)."
> "On desktop, the user's Media Engagement Index threshold has been crossed, meaning the user has previously played video with sound."
> "The user has added the site to their home screen on mobile or installed the PWA on desktop."

Media Engagement Index (MEI) definition:
> Measured through: viewing duration exceeding seven seconds, presence of unmuted audio, active tab status, and video dimensions exceeding 200x140 pixels.

Recommended UX pattern (muted autoplay + user-controlled unmute):
> "One cool way to engage users is to use muted autoplay and let them chose [sic] to unmute."

Example markup given on the page:
```
<video id="video" muted playsinline autoplay>
    <button id="unmuteButton"></button>
```

## Notes
[confirmed — primary source, developer.chrome.com] This is Chrome's own primary documentation, matching the brief's required primary source.
- Direct implication for a WebAudio (not `<video>`) ambience loop: Chrome's `AudioContext` also starts in a `suspended` state until a user gesture on many builds/situations; the safe, policy-compliant pattern is (a) render the page with sound OFF by default / no audio node connected to destination, (b) only call `audioContext.resume()` and connect/ramp gain in response to a real user gesture (click/tap on a visible toggle), which simultaneously satisfies Chrome's autoplay gate AND the "user interacted with the domain" condition for any future audio.
- The MEI pathway (playing unmuted audio >7s repeatedly across visits) is not a reliable design target for a portfolio site — designing for the explicit user-gesture path (toggle button) is the only deterministic, policy-guaranteed approach.
- Gap: page's own last-modified/publication date was not returned by the fetch extraction; Chrome's autoplay policy has been stable in its substance (muted-always-allowed; gesture-gated sound) since Chrome 66 (2018) through current versions, so treat the substance as durable even though the exact revision date on this fetch is unconfirmed.
