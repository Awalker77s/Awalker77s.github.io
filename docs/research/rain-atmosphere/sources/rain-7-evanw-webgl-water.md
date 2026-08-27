# Source: evanw/webgl-water (GitHub) — README fetch + GitHub API metadata

- URL (README): https://github.com/evanw/webgl-water/blob/master/README.md
- URL (API): https://api.github.com/repos/evanw/webgl-water
- URL (LICENSE.md attempt): https://github.com/evanw/webgl-water/blob/master/LICENSE.md → 404 Not Found (no such file)
- Fetch date: 2026-08-27

## Verbatim quoted fragments
> "WebGL Water Demo"
> "http://madebyevan.com/webgl-water/"
[complete README text — no license section, no technique description in the README itself]

## GitHub API ground truth (JSON fields)
> license.name: null
> license.spdx_id: null
> pushed_at: "2022-12-31T11:43:00Z"
> stargazers_count: 1266
> description: "WebGL Water Demo"

## Correction to earlier WebSearch claim
An earlier WebSearch summary (not a direct fetch) asserted "Evan Wallace's WebGL Water project is released under the MIT license." This is now [DISCONFIRMED via direct fetch] — the GitHub API's license field is null (no LICENSE file detected/recognized by GitHub), and both README.md and a guessed LICENSE.md path show no license text. Do not treat this repo as confirmed-MIT. If pursued, would need a manual check inside the repo (e.g. a license comment embedded in a source file header) before assuming safe reuse terms — GitHub's absence-of-detected-license technically defaults to full copyright (all rights reserved) for redistribution purposes, even though the code is publicly viewable.

## Technique / relevance
Not confirmed via fetch whether this demo includes rain droplets striking the surface (vs. just a pre-set wave/caustics/refraction demo controlled by mouse). Public knowledge (Evan Wallace's WebGL Water is a well-known 2011-era demo using height-field simulation + normal-mapped caustics + refraction/reflection, mouse-drag = drop impact) is [reported, unverified via this fetch] — the README contained no description to confirm this from primary source text directly. Last real commit 2022-12-31 (repo is a stable, dormant classic demo, not actively maintained).

## Confidence / verdict
[single-source, license status DISCONFIRMED-as-MIT / actually UNLICENSED per API]. This is a full WebGL height-field water sim (shader-based), which is architecturally the "harder to integrate with DOM content" category per the brief's Falsifiable Question 1 — a full WebGL scene like this is heavier to layer behind readable DOM text than a 2D canvas approach, and its license status is a genuine blocker requiring clarification before any adaptation.
