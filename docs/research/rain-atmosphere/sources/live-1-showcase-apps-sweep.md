# live-1 — Live sweep of Alex's deployed apps (browser pane, get_page_text)

- **Fetched:** 2026-08-27
- **Method:** in-app browser navigation + text extraction (not a web search source — first-party verification of the showcase candidates' live state)
- **Purpose:** confirm each candidate app is up and capture on-page copy for showcase cards

## https://mivoralearn.com — UP

Title: `Mivora — Get genuinely good at AI. Free daily lessons.`

Quoted fragments:

> YOU HAVE THE AI. NOW GET GOOD AT IT.

> Get genuinely good at AI.

> You already use ChatGPT or Claude. Mivora turns that into a real skill — short daily lessons with experiments you run in your own AI, from first prompt to RAG to agents. Mastery you earn, a toolkit you keep.

> 14 of 55 mastered

Lesson cards visible: "What Is AI, Really?" · "Context Is Everything" · "Build a RAG Pipeline". Four pillars: "Practice in your own AI" / "Mastery you earn" / "A toolkit you keep" / "The frontier library". Footer: "Free · one account, every device".

## https://echinoid-ui.vercel.app — UP

Title: `Echinoid ID — AI-Assisted Fossil Echinoid Identification`

Quoted fragments:

> POWERED BY BILL THOMPSON'S TAXONOMY

> Identify fossil echinoids with expert confidence

> Honest confidence levels — no false certainty.

4-step process shown: Upload photos → Add field details → Analyze visible features → Compare with echinoids.com. On-page stats: "68+ species", "400+ reference photos", "1,200+ identifications". Pricing: FREE £0 (3 free IDs) / PRO £9.99/month or £79.99/year.

**Note:** "68+ species" is a corpus-size stat on the page, NOT the unreproducible ~68% accuracy claim the vault forbids. Card copy must not state accuracy percentages; the audited artifacts show 38.1% visual genus top-1 on 21 cases (vault: Echinoid.md).

## https://mother-truckin-pizza.vercel.app — UP (staging)

Title: `Mother Truckin' Pizza | Jacksonville Pizza Food Truck` (SPA routes to `Schedule | Mother Truckin' Pizza`)

Quoted fragments:

> WHERE THE TRUCK WILL BE NEXT

> READY TO FEED A CROWD?

> Tell us the date and the owner will call you back to talk through availability, menu needs, and next steps.

Phone on page: 904-515-2055. Schedule list stuck at "LOADING SCHEDULE / Checking the latest public truck stops." — expected: production Supabase/Resend env vars are unset so the inquiry/schedule API returns 503 (vault: mother_truckin_pizza.md). Static pages (home/menu/catering) render fine; screenshot should target a static route, not the schedule list.
