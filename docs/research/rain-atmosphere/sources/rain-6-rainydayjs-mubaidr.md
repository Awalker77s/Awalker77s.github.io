# Source: mubaidr/rainyday.js (GitHub)

- URL: https://github.com/mubaidr/rainyday.js
- Fetch date: 2026-08-27
- Last commit date: CONFIRMED via GitHub API (https://api.github.com/repos/mubaidr/rainyday.js): pushed_at = "2023-06-09T03:16:05Z"
- Stars: 126 (API-confirmed)
- License: "GPL-2.0 license" — CONFIRMED via GitHub API: license.name = "GNU General Public License v2.0", license.spdx_id = "GPL-2.0"

## Technique / scope
> The project simulates "raindrops falling on a glass surface" — rain-on-glass, NOT rain striking a water surface with propagating ripples.

## Confidence and verdict
[confirmed - 1 primary, scope-limited] — this confirms rainyday.js is a rain-ON-GLASS effect (droplets sliding down a pane with refraction/blur of a background image), which does NOT match the required "rain striking a water surface with ripples propagating along a waterline" brief. It is NOT a candidate for the water-surface/ripple requirement. Also GPL-2.0 is copyleft and a materially worse license fit for a proprietary-feeling commercial portfolio than MIT-style alternatives (GPL-2.0 code, if copied substantially, would create copyleft obligations) — this is a meaningful license-compatibility strike against using its source directly, though the general "canvas raindrop with irregular blob shapes + reflection" technique can still be learned from and re-implemented independently without inheriting the license.
