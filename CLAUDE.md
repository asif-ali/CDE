# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A single-page pitch site for **Chemical Dynamics Enterprises WLL** (CDE), a Doha-based supplier of
chemicals, laboratory equipment and online analyzers. It proposes two things at once: formalising
the CDE brand, and adding an **IT Services** offering alongside the existing chemicals business.

The two sides are named **Products & Services** and **IT Services** throughout. Earlier drafts
called them *CDE Process* and *CDE Digital*; that naming is retired — don't reintroduce it.

It is a client-facing concept to be presented, not a running product. `README.md` is the pitch
argument and the design rationale — read it before making content or design changes, because most
of the choices in `index.html` are deliberate and explained there.

## Commands

There are none. No build, no dependencies, no tests, no package manager.

```
open index.html          # macOS — that's the whole workflow
```

Fonts are the only external dependency (Google Fonts CDN).

## Architecture

Three HTML pages, each entirely self-contained — `<style>` in the head, markup, then a `<script>`
at the bottom:

| Page | What it is |
|---|---|
| `index.html` | The pitch site. Everything below describes this unless stated otherwise. |
| `manpower.html` | Manpower Supply Division. Added 2026-10-06. |
| `products-services.html` | Chemicals, equipment, analyzers and the suppliers list. Split out 2026-10-07. |
| `it-services.html` | The six IT service groups and the partner block. Split out 2026-10-07. |
| `careers.html` | Public job application form. Added 2026-08-11. |
| `admin.html` | HR dashboard — applications and enquiries, Supabase Auth login, private document viewer. |

Binary assets live in `assets/`. **No build step and no dependencies** is still the requirement —
do not introduce a bundler, framework, CSS file or npm dependency, and keep each page's CSS and JS
inline in that page. The careers pages talk to Supabase over plain `fetch`; there is deliberately
no `supabase-js`, precisely so the rule holds.

The one server-side thing in the repo is `supabase/` — a SQL schema and one Deno Edge Function.
That is not part of the site build and never ships to the browser; it is deployed separately with
the Supabase CLI. `CAREERS-SETUP.md` is the runbook and the threat model. Read it before touching
anything under `supabase/`, and note the rule that governs all of it: **the browser holds no
secret and enforces no authorisation.** Row-level security in Postgres is the boundary. Never
"fix" a permissions problem by adding an RLS policy for `anon` on `applications` or by moving a
key into a page.

It was a single self-contained file until the client asked for photography; base64-embedding
~1.2MB of JPEG was worse than a folder, so `assets/` exists now. That is the only reason to add
one — new *code* still belongs inline.

`index.html`, top to bottom: sticky header → hero → industries strip → About → the three
division cards (`#divisions`) → Why CDE → Contact → footer. The division cards are a router, not
content: each links to its own page. `#about`, `#why` and `#contact` are still in-page anchors
and `scroll-padding-top` compensates for the sticky header; `#products`, `#suppliers` and
`#digital` are gone, replaced by `products-services.html`, `products-services.html#suppliers`
and `it-services.html`.

The three division pages share a shape: a `.hero` carrying the page's own `<h1>`, then the
sections lifted from the old home page. Each page has exactly one `<h1>` and its own title,
description and canonical — that is the entire point of the split, so don't collapse them.

The only JavaScript: the footer year, the mobile menu, and `sendEnquiry()`, which posts the
contact form to the `submit-enquiry` Edge Function. It was a `mailto:` until 2026-10-06, which
did nothing visible on a phone with no mail client — every enquiry sent through it was lost
silently. `manpower.html` carries the same handler, differing only in that it prefixes `division`
with "Manpower —".

All three public forms carry an off-canvas `website` honeypot, added 2026-10-07 in place of
Cloudflare Turnstile (which stays wired but unconfigured). `careers.html` rejects a trip outright
so no files reach the bucket; the two enquiry forms file it as `spam` instead, because an enquiry
is cheap to store and impossible to recover once thrown away. `CAREERS-SETUP.md` step 5 has the
reasoning. **The field name is agreed between the page and the Edge Function — rename it in one
place and it silently stops working.**

Enquiries land in the `enquiries` table and are read in `admin.html`'s **Enquiries** tab.
**There is no email notification, by decision** — that tab is the only place an enquiry surfaces,
which is why it carries an unread count. Adding notification means a database webhook into Resend
or SendGrid, the same unfinished item as for applications in `CAREERS-SETUP.md`.

### CSS conventions

Everything is driven by the custom properties in `:root`. Colours were sampled from the live
`chemicaldynamicsqatar.com` — do not invent new ones; reuse the tokens.

| Token | Value | Role |
|---|---|---|
| `--slate` | `#4C5166` | Headings, primary buttons, footer/band backgrounds |
| `--teal` | `#25AFB4` | Brand accent — used for the **chemicals** side |
| `--blue` | `#2480C3` | Secondary accent — used for the **IT Services** side |
| `--grey` | `#858A9F` | Body copy |
| `--slab` | Roboto Slab | Headings only |
| `--sans` | Roboto | Body copy (slab serif is too heavy for long spec lists) |

Class names are terse and reused rather than semantic-per-section: `.wrap` (max-width container),
`.sh` (section heading block), `.c` (card), `.st` (numbered step), `.btn`, `.eyebrow`, `.rule`.
Imagery adds `.ph` (a photo absolutely filling its parent, used as a section background — the
parent needs `position:relative;overflow:hidden` and an explicit `z-index` order) and `.figure`
+ `.cap` (a bordered, rounded photo with a gradient caption over its foot).
A trailing `.b` modifier switches a component from teal to blue — `.c.b`, `.sh.b`, `.rule.b`.
That teal/blue split is load-bearing: it visually separates the chemicals catalogue from the new
IT services while keeping both inside the client's existing palette. Preserve it.

`.s` is the third of these, added 2026-10-06 for the manpower division, and it uses `--slate`.
It is slate because the palette rule forbids inventing a colour and there was no third one to
sample — not because slate was chosen for manpower. **A real third brand colour is a client
decision still outstanding**; when it arrives it replaces five declarations at the top of
`manpower.html` and nothing else.

Layout is CSS grid with `auto-fit`/`minmax`, so cards reflow without per-breakpoint rules. The
content box is 1080px (1180px `.wrap` minus 2×50px gutter) — worth knowing, because `minmax`
minimums interact with it in ways that orphan the last card if you add one. `.grid.g4` pairs
the four IT cards 2×2 for exactly that reason. The explicit breakpoints are 1180px (nav links
hide and the `.burger` takes over), 900px, 840px, 820px and 560px (the header
`.btn` moves into the menu panel).

That nav breakpoint is measured, not chosen: logo 202 + links 729 + button 109 + two 20px flex
gaps = 1080, which is exactly the content box, so the header needs the full 1180. It was 1020,
and the nav silently overlapped the logo between 1020 and ~1090 even before the seventh link
(Careers) was added; both were fixed on 2026-08-11, along with `white-space:nowrap` on `.btn`,
which had been breaking "Contact Us" across two lines at every width.

The eighth link (Manpower) arrived on 2026-10-06 and something did have to give: **the header
`Contact Us` button was removed** on all three public pages. Shortening "Products & Services" to
"Products" would also have fitted, and was rejected — that name is fixed "throughout" by the
naming rule above, and a nav that disagrees with the section it points at is worse than a missing
button. The button survives inside the `.mnav` panel, and `Contact` remains a nav link. A ninth
link has no room left at all without dropping a label.

Headless Chrome clamps its viewport to a 500px minimum, so it cannot screenshot a 390px phone
layout — a capture at `--window-size=390` renders at 500 and crops, which looks like an overflow
bug but isn't. Verify narrow layouts at 500px, or measure `documentElement.scrollWidth`.

## Content rules

These come from decisions already made with the client; don't reverse them incidentally.

- The **legal entity stays "Chemical Dynamics Enterprises WLL"**. "CDE" is the trading brand; the
  full name belongs in the logo lockup, the About facts panel and the footer only.
- **No invented statistics.** The client's current site has unbacked percentage claims; removing
  them was a deliberate credibility decision. Only add metrics if given real ones.
- **Nexvera appears only as a footer credit** ("Designed and developed by Nexvera Technologies
  Ltd", added 2026-07-29 on request, reversing an earlier no-attribution rule). Everywhere above
  the footer, CDE presents as a single integrated company and the IT services are CDE's own —
  don't introduce Nexvera into body copy, service descriptions or the About section.
- Contact details, address, phone and social links are real and taken from the live site. Don't
  edit them without a source.
- **Only list services that are deliverable today.** This is the most important rule here. An
  earlier draft sold industrial digitalisation — SCADA on the dosing skids, LIMS in the labs,
  data historians, predictive maintenance, OT/IT security. None of it was deliverable, and none
  of it came from CDE; it had been inferred from their product catalogue. It was removed in
  `f412ea4`. Do not reintroduce that class of claim unless CDE partners with an automation
  integrator. The only automation wording CDE themselves publish is *"Automatic control and
  process Integration services"*, on their dosing pumps page.
- Four of the six IT Services groups (Websites & Applications, Business IT & Security, Business
  Systems & Compliance, Brand & Digital Marketing) are drawn from the real Nexvera service stack.
  The other two (Artificial Intelligence & Data, Immersive Training & Simulation) are delivered
  with named partners — VezTek USA and TruSense — and are attributed in the "Specialist partners"
  block rather than implied to be in-house. New services belong on the page only if they come
  from the Nexvera stack or a documented partner.
- **VezTek's capability statement is marked confidential** and names Toyota, Warner Bros.,
  DirecTV, Canon, DHS and TSA, with figures from a $48M bank programme and a 450-site federal
  identity project. **None of it may go on the site** without written clearance from VezTek on
  agreed wording. Card copy follows CDE's own `CDE IT Division` brief instead. TruSense's profile
  is unmarked, but only capability-level description is used from it — no client or project names.
- **POS systems (Talabat/Snoonu/Rafeeq) and TikTok/Snapchat campaigns are deliberately omitted**
  even though Nexvera offers them — they target cafés and retail, and CDE's audience is oil &
  gas, power and fertiliser. Social is framed LinkedIn-first for the same reason. Adding them
  back is a strategy decision, not a copy-paste.
- The pitch is a **distribution** advantage, not a capability one: "you already buy from us and
  you need this anyway", not "we're the best IT firm in Qatar". Don't write copy claiming
  technical superiority or a proprietary edge.

## Multi-page since 2026-10-07 — and why

The site was one page until 2026-10-07. The split was considered on 2026-07-29, deferred, and
then done; the reasoning, so it isn't relitigated in either direction:

**Why it was deferred.** No real photography, no client list (their own Customers page 404s), no
case study — four thin pages read worse than one substantial one. And there was no mobile menu,
which made a multi-page site genuinely unusable on a phone.

**What changed.** The mobile menu was built on 2026-10-06. `manpower.html` then demonstrated the
pattern working: its title targets "manpower supply qatar" and "scaffolders doha", which a
`#manpower` section never could. A page carries one title, one description and one canonical, and
Google ranks pages — so one page could only ever compete for one cluster of intent. CDE sells
three largely unrelated things, which made that ceiling expensive.

**What was split, and what deliberately wasn't.** Products & Services (with Suppliers) and IT
Services became pages, joining Manpower. About (190 words), Why CDE (117) and Contact (118)
stayed as sections on the home page: they have no independent search intent and are far too thin
to stand as pages. Splitting on the nav rather than on the business lines would have produced
exactly the thin-content problem that justified deferring in the first place. **If you add a
page, it needs its own search intent and roughly 400+ words — `manpower.html` at 431 is the
floor, not the target.**

**The cost, which is now permanent.** With no build step every page hand-duplicates the header
and footer, and they will drift. That is six files now. `index.html`, `products-services.html`,
`it-services.html`, `manpower.html` and `careers.html` each carry their own header; the
four-column footer is in all of those except `careers.html`, which has a cut-down one with no
columns. `admin.html` has no public header or footer at all.

**All five public nav link lists are identical** — eight links, same order, differing only in the
`.on` marker and whether in-page hrefs are bare (`#about` on the home page) or prefixed
(`index.html#about` everywhere else). A diff between any two headers should be that small. The
`.nlinks` and `.mnav` lists are maintained by hand and both must be changed together.

Still not a reason to add a build step — that would cost the "opens from disk, host anywhere"
property that makes this easy to hand over. It is a reason to expect the next structural change
to cost more than this one did.

## Assets

`assets/cde-emblem.png` is the client's genuine logo mark, taken from their own server; the
`-white` variant is the same file recoloured for the dark footer. Both are real brand assets —
don't substitute a drawn approximation. Only web PNGs exist; the vector original is still to come.

`assets/manpower/` holds six 176px square thumbnails, shown at 64px, for the trade cards —
same convention as `assets/products/`. **Their provenance is not verified.** They were supplied
as temporary generated URLs in `manpower division.txt`, and on inspection the set is mixed: two
look AI-generated (one is a 1024×1024 square), four look like commercial stock photography, and
two of those show timber-frame construction, which is a North American or European building
method rather than a Qatari one. They are cropped to thumbnails partly for that reason. **Before
launch, confirm CDE actually holds a licence for these, or replace them** — the five large
photographs are Unsplash-licensed and documented precisely because that mattered. The
full-resolution downloads were kept outside the repo, on the Desktop in `cde-manpower-images/`.

`assets/products/` holds 64px card thumbnails cropped from **CDE's own catalogue images**, taken
from their live Products page. Those sources are 187–458px, which is why they appear only at
thumbnail size — do not scale them up into banners. `Picture4.jpg` (cooling towers) was excluded
because it carries a stock-library watermark.

The ten principals in the Suppliers section (HACH, INJECTA, INEOS and so on) are quoted verbatim
from CDE's own Suppliers page — real trading relationships, not illustrative names. Don't add to
that list without a source.

**The five large photographs are stock placeholders and none of them show CDE.** They are Unsplash-
licensed (commercial use, no attribution needed) and exist so the page reads as finished. They
must be replaced with CDE's own photography before launch — README documents each one, its
source ID and the selection rules (no third-party branding visible, no emissions imagery on a
page selling water treatment, blue-dominant hero to sit inside the gradient).

Each of those five now has **`srcset` variants** alongside it (`hero-plant-800.jpg`,
`hero-plant-1200.jpg`, and so on), added 2026-08-12. **Replacing a photograph means regenerating
its variants**, or the page will serve the old picture to most phones. They were made with `sips`:

```
sips -Z <width> -s formatOptions <quality> <name>.jpg --out <name>-<width>.jpg
```

Quality is deliberately split by role. The three full-bleed `.ph` washes (hero-plant, it-network,
doha) render at 13–30% opacity under gradients, so their variants are quality 65 at 800px and
**50** at 1200px — verified by screenshot as indistinguishable. The two `.figure` photos
(water-treatment, laboratory) are shown at full opacity with captions and stay at 72–78.

Two things measured on 2026-08-12, so nobody repeats the experiment:

- **Do not recompress the originals.** They are already efficiently encoded. Re-encoding at
  quality 70 made every one of them *larger*; at 55 it saved about 5% for visible quality loss.
- The saving is real but smaller than a naive calculation suggests, because high-DPR phones
  legitimately need the big files. Mid-range phones (≈500px at 2x) drop from 1425 KB to 1006 KB
  and the LCP image from 209 KB to 82 KB; a 3x phone and a retina desktop still fetch the
  originals and save nothing. The remaining win is WebP/AVIF, which needs tooling this machine
  does not have (`cwebp`/ImageMagick absent, and `sips` cannot write WebP here).

## Known placeholders

The contact form is `mailto:`-only. `README.md` ("Before this goes live") lists the remaining
content gaps — vector logo, year established, client names, supplier brands, real photography,
an IT case study, CR number and ISO certifications.

`careers.html` and `admin.html` each carry a `CFG` block at the top of their `<script>` holding
`YOUR-PROJECT-REF` placeholders. Until those are filled in, neither page can reach a backend —
the form will fail on submit and the dashboard will fail on sign-in. `CAREERS-SETUP.md` is the
checklist. Two things there are decisions rather than steps and are deliberately left undone:
Cloudflare Turnstile (the form works without it, unprotected) and the **data retention period**,
which nobody should pick on CDE's behalf. Qatar's PDPPL applies — the form collects QID and
passport images.

One live claim still needs checking with CDE: *"an established Qatari company with premises in
Doha and a client base across the country's largest industries"* in the "Why CDE" section.
