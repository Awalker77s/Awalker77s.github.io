# Cyberpunk skyline structures — replacing the antenna spire

Research date: 2026-08-31. Standard tier, one researcher. Scope: which structure
types beyond plain towers read as cyberpunk at pure-silhouette scale, supertall
proportions, and anti-patterns — for the three-band baked-sprite city in
src/lib/rain/engine.ts. Anchor lens: docs/research/underwater-city/city-canvas.md
(skyline generation, depth, windows, cars — not re-researched).

## BLUF

- **The current spire is the wrong shape for what it's trying to say.** It is a 1px free-floating line + two glow dots reaching from a near-band tower up into open sky — architecturally, that reads as a mast/antenna *bolted onto* a regular building, not a supertall tower. Real-world tall-building convention explicitly measures height "including spires, but not including antennae" [confirmed — 1 fetched mirror + search-level corroboration, source 08] — i.e., an antenna is definitionally the wrong element to signify "this building is a supertall." A **tapered/stepped mass integrated into the tower's own silhouette** is the correct replacement shape, and this is independently the single strongest, best-corroborated cue in this whole research pass: BR2049's Wallace Towers (pyramid-shaped megatower, [confirmed — 1 first-party, source 01]) + the already-confirmed city-canvas.md finding that "tiered/tapered towers... setback towers are the strongest single 'future city' silhouette cue" [confirmed — 2, anchor doc].
- **Only a subset of candidate structures is evidenced by the specific named references.** CONFIRMED across independent source types: supertall megatower with a distinctive tapered/pyramidal crown as a singular "hero" landmark (not multiplied); dense uniform megablock/arcology-style clusters as the *background* fabric, structurally and materially distinct from the hero tower; skybridges/elevated pipeline-highways as a genre-founding motif (Akira/Neo-Tokyo, [confirmed — 2 independent source types, sources 02 + 11]). **NOT confirmed** for BR2049/GITS/CP2077/pixel-art posters: elevated monorail/train lines, construction megacranes, cooling/refinery stacks, ring/halo-topped towers.
- **Restraint, not addition, is what reads as "more cyberpunk."** Four independent source types converge: more objects/lights/hues does not read as more cyberpunk, purposeful restraint does [confirmed — 2+ independent source types, sources 02, 06, 07 + anchor]. The tallest-value single change is not "add five new structure types," it's "give the hero position an actually-supertall silhouette, and add at most one more genre-authentic connective element (a skybridge)."
- **A hero tower can dominate through material/color contrast, not just height** — Cyberpunk 2077's Arasaka Tower reads as the skyline's most imposing structure via "smooth black steel and glass" against the surrounding megablocks, not primarily via extra height [confirmed — 1, practitioner analysis, source 09]. Directly portable to a baked-sprite fill-color technique inside the existing cyan-dominant palette.
- **Slenderness numbers give a concrete target ratio.** 1:10–1:12 width:height is the engineering threshold for "slender"; real supertalls range ~1:7 (merely tall) to 1:15 to an extreme 1:23 [confirmed — 1 authoritative museum source, source 03]. At silhouette scale the extreme end risks rendering as a sub-pixel hairline — a translation risk no source addresses (see Risk).

## Q1 — Structure types and silhouette readability

**Confirmed:** (1) supertall megatower with tapered/pyramidal crown as a singular hero landmark — BR2049 Wallace Towers [source 01, first-party Weta], CP2077 Arasaka HQ [source 09], corroborated by the anchor doc's "one or two oversized masses" finding; (2) dense uniform megablock/arcology clusters as background fabric, distinct from the hero — CP2077 "Megablocks" explicitly Metabolism-inspired [source 09], BR2049 "megalithic" scale [source 01], CLIP STUDIO TIPS "overlapping forms... continuous skyline" [source 02]; (3) material/color-differentiated hero tower — Arasaka's "smooth black steel and glass" vs. surrounding styles [source 09]; (4) skybridges/elevated pipeline-highways — Akira/Neo-Tokyo "skybridges, networks of pipelines and highways... sky highways... crammed with housing underneath" [confirmed — 2, source 11 academic + source 02 practitioner tutorial independently naming "cables, pipes and layered structures"].

**Not confirmed (true nulls or theme-only, despite targeted searches against all four named references):** elevated monorail/train lines specifically; construction megacranes as a *silhouette* element (Akira confirms construction as a *theme*, not a shape convention — source 11); cooling/refinery stacks (zero hits); ring/halo-topped towers (zero hits); tethered/static blimps as a distinct structure (search-level only for original Blade Runner — and the engine already has a moving blimp); literal ziggurat as distinct from the already-confirmed tapered/setback tower (same cue, not two).

**Ghost in the Shell specifically:** confirmed via a second independent angle (032c magazine, source 12) that Kowloon Walled City was the direct photographic reference (location scout Higami Haruhiku) and the design goal was to "evoke a feeling of submerging into the deep levels of the city, where a flood of information overflows the human senses" (curator Stefan Riekeles). GITS's "advancement" is signage/atmosphere density on real-world-referenced massing, not new sci-fi silhouette shapes. Any skybridge reading for GITS specifically is inferred, not directly quoted — [speculation — flagged].

## Q2 — Supertall proportions

Slenderness ratio (width:height), not raw height, is the operative variable: 1:10–1:12 is the engineering "slender" threshold; WTC North Tower ≈1:7 (merely tall/big); 432 Park Ave 1:15; 111 W. 57th St 1:23 (extreme) [source 03, The Skyscraper Museum]. "Tall and BIG are not the same thing" (source 03). CTBUH's height-counting convention — spires count, antennae excluded [source 08] — is the most directly actionable finding for this task. A hero tower's dominance also comes from a large ratio vs. its *few* immediate neighbors, not absolute height, and count should stay small (singular/rare) per triangulated BR2049 + CP2077 findings. Crown/taper shape (already confirmed in the anchor doc) matters as much as the ratio.

## Q3 — Anti-patterns

Four independent source types (first-party tutorial source 02, practitioner interview source 06, studio blog source 07, and the anchor doc's Pixel City finding) converge: restraint beats addition; peripheral detail matters less than silhouette; detail should be scale-appropriate (far/mid = silhouette hierarchy, near = dense detail — directly validating this engine's existing band split); gaps between buildings matter ("density ≠ believability"). Net anti-pattern list: don't add several new structure types simultaneously; don't push detail into far/mid bands; don't add a new hue; don't add new per-frame motion outside existing cheap live-overlay mechanisms.

## Preserve / Change / Avoid / Risk

**Preserve** (already correct — do not touch):
- The bake-once-to-offscreen-sprite architecture for all three bands.
- The existing tiered/setback silhouette cue already in the far/mid band generation.
- The existing mid-band antenna-beacon system (top 15% of mid buildings, 2–4 beacons, cyan pulse).
- The existing skill-carousel blimp — it already occupies the "airship" slot; do not add a second, static/tethered blimp.
- The existing 2-billboard near-band system and the cyan-dominant 4-hue palette.
- The gaps-between-buildings discipline in walkBuildings/CITY_BANDS gap ranges.
- The far/mid = pure silhouette, near = window/detail split.

**Change** (ordered by fidelity vs. effort):
1. **Minimal option:** replace the 1px line + 2 circles at the live-draw site with a tapered polygon: full mast width at topY, narrowing through 1–2 discrete setback steps (~60% width at 1/3 of the added height, ~25–30% at 2/3, ending ~15–20% at the crown) — implementing the confirmed setback cue; keep the added portion's slenderness roughly 1:8–1:12. Reuse the existing beacon array for the crown light.
2. **Full-fidelity option:** bake the hero shape into the near band sprite at generation time with the same tapered/setback silhouette, plus a distinct fill tone (violet-shifted variant of the band indigo — reusing NEON_VIOLET/HAZE_VIOLET, not a new hue) for the material-contrast cue. One extra branch in the bake loop, no per-frame cost.
3. **One additional element, and only one:** a single skybridge — a 1–2px static stroke connecting two adjacent mid-band towers of similar height, baked into the band sprite, optionally with 2–3 static dot-lights at existing WINDOW_ALPHAS values. [confirmed — 2] backing; zero runtime cost.
Route sizes through the existing isMobile scale conventions rather than a new mobile rule.

**Avoid:**
- Monorails, construction cranes, cooling/refinery stacks, ring/halo-topped towers — not evidenced for the named references.
- A second blimp/airship.
- Window-grid or near-band detail pushed into far/mid bands.
- A fifth accent hue.
- Any per-frame animation for the bridge or crown outside existing cheap overlay arrays (beacons/mutable windows).

**Risk:**
- Slenderness ratios are measured on full-scale buildings; no source addresses 10–130px silhouettes — the most extreme ratios may render as an invisible hairline. Test the chosen taper in-browser at real widths before locking pixel numbers.
- The CTBUH spire-not-antenna finding is [confirmed — 1 fetched mirror + search-level corroboration], not full independent-primary (ctbuh.org 403'd on every attempt).
- The GITS→skybridge connection is inferred from Kowloon Walled City influence, [speculation — flagged]; the Akira skybridge finding it leans on is solid.
- Monorails/cranes/stacks/ring-towers returned genuine nulls; wanting them anyway is a legitimate creative choice, made knowingly as "not genre-verified."

## Limitations / [insufficient evidence]

Monorails, megacranes-as-silhouette, cooling stacks, and ring-towers were actively searched against all four named references and came back null/theme-only. Blocked primaries that could not be independently verified: both Weta Workshop Design Studio ArtStation galleries, theasc.com, domusweb.it, archpaper.com, all three CTBUH domains/PDF (mirror used at reduced confidence). The GITS/Kowloon→skybridge inference is exactly that. No source discusses slenderness at pure-silhouette pixel scale. Sources 04 (tokyoartbeat) and 05 (adrianlungu substack) contributed essentially no load-bearing content.

## Sources consulted

**Fetched with usable content** (all 2026-08-31, quoted fragments in sources/):
01 wetaworkshop.com/projects/bladerunner-2049 (first-party); 02 tips.clip-studio.com/en-us/articles/11700 (tutorial); 03 skyscraper.org/super-slenders/slenderness (museum); 04 tokyoartbeat.com cityscapes (weak); 05 adrianlungu.substack.com CP2077 visual style (weak); 06 80.lv sci-fi environment design; 07 garagefarm.net environment design principles; 08 designingbuildings.co.uk/wiki/Supertall (CTBUH mirror); 09 linkedin.com/pulse Skarżyński CP2077 architecture; 10 thedissolve.com GITS review (weak); 11 intjournal.com Akira/Neo-Tokyo megastructure (strongest, academic); 12 magazine.032c.com GITS architecture.

**Blocked (403/unreadable):** Weta Workshop ArtStation galleries ×2; theasc.com BR2049; domusweb.it CP2077; archpaper.com CP2077; ctbuh.org/criteria + skyscrapercenter.com/criteria; cloud.ctbuh.org PDF (unreadable binary); deadline.com Gassner interview (paywall gate).

**Null searches:** "cyberpunk concept art skybridge elevated walkway megastructure connecting towers" (noise only — the skybridge confirmation came from an Akira-specific rewording); construction-megacrane and cooling-tower/refinery-stack skyline searches (true nulls); ring/halo-topped-tower search (true null); "Ghost in the Shell elevated monorail train iconic shot" (unconfirmed, not evidence of absence).

## Additional Leads (not chased)

Weta Workshop Design Studio ArtStation galleries and Krzysztof Olborski's CP2077 Megabuilding portfolio (blocked, need rendered fetch); Domus + Architect's Newspaper CP2077 features (403'd, likely high-value); "The World of Cyberpunk 2077" art book (paywalled — strongest first-party upgrade for CP2077 claims); Syd Mead's original Blade Runner blimp design notes (lower priority — engine already has a moving blimp).
