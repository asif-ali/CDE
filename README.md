# CDE — rebrand and diversification concept

A single-page site to present to Chemical Dynamics Enterprises WLL: the CDE brand formalised,
the existing chemicals business intact, and a new IT services offering alongside it.

`index.html` + `assets/` — no build step, no dependencies. Open it in a browser.

---

## The argument to make in the room

### 1. The rebrand is already half-done

This is the easiest point to open with, because it isn't really a proposal — it's a
completion. Their current WordPress site already:

- sets `og:site_name` to **CDE**
- titles every page `… – CDE`
- names the nav item **"About CDE"**
- stores the favicon as `cropped-CDE-270x270.png`

Somebody already started moving to CDE and stopped halfway. The site still says
"Chemical Dynamics Enterprises WLL" in the hero and footer while the metadata says CDE.
You're proposing they finish it, not start it.

### 2. A second offering, not a renaming

The legal entity stays **Chemical Dynamics Enterprises WLL** — no CR change, no supplier
paperwork, no disruption to certifications, LinkedIn or existing contracts. What changes is
the trading presentation:

- **Products & Services** — the existing chemicals, equipment and instruments business
- **IT Services** — the new offering

The three letters carry the brand; the full name recedes to the footer and legal documents.
This matters because "Chemical Dynamics Enterprises" argues against diversification every
time it's said out loud. "CDE" doesn't.

### 3. The IT services are a distribution play — be honest about that

An earlier draft of this site sold industrial digitalisation: SCADA on the dosing skids,
LIMS in the labs, data historians, OT security. It made a much stronger strategic story —
but **none of it was deliverable**, and none of it appeared anywhere in CDE's own material.
It has been removed. What's on the site now is the standard business IT stack, all of which
can actually be delivered today.

That changes the argument, and it's worth being clear-eyed about how:

- **What CDE does *not* have** is a unique capability. Anyone in Doha can build a website.
  There's no technical moat here.
- **What CDE *does* have** is trust and access — an established Qatari company with premises,
  a client base across the country's largest industries, and existing commercial relationships
  with businesses that all need websites, email, IT support and e-invoicing readiness.

So the sale isn't "we're the best IT firm in Qatar." It's "you already buy from us, you
already trust us, and you need this anyway." That's a real advantage, but it's a
**distribution** advantage rather than a capability one — which means pricing and delivery
quality matter more than they would if CDE had something proprietary.

**Near-term hook:** Qatar's Council of Ministers approved the e-invoicing law in May 2026,
with a phased rollout expected from 2027 — large firms first. CDE's existing clients are
exactly the large firms in the first phase. That's a concrete, dated reason to open the
conversation this year rather than "someday", and it's the one place where CDE's existing
client list is a genuine, specific advantage.

---

## What the IT Services section covers

Four groups, all drawn from the Nexvera service stack — nothing here is aspirational:

| Group | Contents |
|---|---|
| **Websites & Applications** | Websites and landing pages (Arabic + English), iOS/Android apps, customer portals and online ordering, custom applications, hosting and maintenance |
| **Business IT & Security** | Business email and Microsoft 365, day-to-day support and helpdesk, backups and disaster recovery, cyber security, networks and devices |
| **Business Systems & Compliance** | E-invoicing readiness, invoicing/CRM/workflow automation, inventory and procurement, document management, integration and data migration |
| **Brand & Digital Marketing** | Logo and brand identity, Google Business Profile and local SEO, LinkedIn and social media, paid campaigns, company profiles and datasheets |

**Two items from the Nexvera Qatar poster were deliberately left out.** POS systems with
Talabat/Snoonu/Rafeeq integration, and TikTok/Snapchat campaigns, are aimed at cafés and
retail. CDE's audience is oil & gas, power and fertiliser — putting delivery-app integration
on this page would undercut the whole proposition. Social media is framed as LinkedIn-led for
the same reason. Easy to add back if CDE wants to chase SME clients too, but it should be a
deliberate decision rather than a copy-paste.

---

## Design decisions worth explaining

**Their own colours and typeface, sampled from the live site.** Nothing invented — these were
read off `chemicaldynamicsqatar.com` directly:

| Token | Value | Where it's used on their current site |
|---|---|---|
| Teal | `#25AFB4` | Brand accent, links, "Enterprises WLL" in the logo |
| Slate | `#4C5166` | Headings, primary buttons |
| Blue | `#2480C3` | Active nav item, secondary buttons |
| Grey | `#858A9F` | Body copy |
| Backgrounds | `#FFFFFF` / `#F9F9F9`, `#EAEAEA` rules | Section alternation |
| Typeface | **Roboto Slab** | All headings and body |

The teal/blue hero gradient echoes the nebula image on their current homepage. Products use
teal, IT Services uses blue — both already in their palette, so the new section reads as part of
the same brand rather than a bolt-on. Body copy is set in Roboto (same family lineage) rather
than Roboto Slab, purely because long specification lists in a slab serif get heavy; headings
stay Roboto Slab so the brand voice is unchanged.

**The homepage leads with what they sell, not with org structure.** An earlier draft opened on
"two divisions" — but nobody arriving cold cares how the company is organised internally. The
hero now carries their existing tagline, *"Renowned supplier of Chemicals, Laboratory Equipment
& Online Analyzers"*, with CDE above it. IT Services appears after the full product catalogue,
introduced as *"New from CDE"* — an extension of an established business, which is both more
honest and more persuasive than presenting a new offering as an equal half of the company.

**Page order deliberately mirrors their existing navigation** — About CDE, Products & Services,
Contact — with one new section inserted. It's an addition to a site they already know, not a
rebuild they have to re-learn.

**The logo is now their real one.** Pulled from their own server and stored in `assets/`:

| File | Source | Used for |
|---|---|---|
| `cde-emblem.png` | `wp-content/uploads/2024/01/CDE.png` (522×522) | Header mark |
| `cde-emblem-white.png` | The same file, recoloured white | Footer mark, on the dark band |
| `cde-logo-full.png` | `wp-content/uploads/2024/01/chemical.png` (300×65) | Kept for reference; not currently placed |

The emblem is `#2480C3` — exactly the blue already in the palette, which is a useful
coincidence: the mark needs no adjustment to sit in the design. In the full lockup
"Chemical Dynamics" is black and "Enterprises WLL" is `#00587E`. *(An earlier version of
this README described it as slate and teal. That was wrong — these values are sampled
from the file.)*

The header pairs the real emblem with the **CDE** wordmark rather than dropping in the full
lockup, because the lockup leads with "Chemical Dynamics Enterprises WLL" and works against
the CDE-forward argument in section 1. The emblem is the part of their identity people
recognise, and at 522px it stays sharp on any screen — the 300×65 lockup would not.

**Still worth asking for:** the original vector (AI/EPS/SVG). Everything here is derived from
web PNGs, which is fine on screen but not for print.

**The invented statistics are gone.** The current homepage shows "96% ACCURACY / 95%
SUCCESS-RATE / 92% BETTER DATA / 98% COST-EFFECTIVE" with nothing behind them. For an
industrial buyer these actively damage credibility — they're the kind of thing a procurement
engineer notices. They've been replaced with a factual company panel. If they want metrics
back, they need real ones (years trading, sites served, client count).

**Nexvera is credited in the footer** — "Designed and developed by Nexvera Technologies Ltd",
linking to nexvera.co.uk/qa. This reverses the earlier decision to keep the site free of any
attribution; it was changed on request on 2026-07-29. The credit is deliberately quiet: small,
below the copyright line, in the footer only. CDE still presents as a single integrated company
everywhere above it, and the IT services are still sold as CDE's own.

---

## Suppliers, and their own product images

**The principals section is the strongest credibility asset on the page**, and it costs nothing —
all ten names are taken verbatim from their own Suppliers page: HACH, INJECTA, INEOS, TURBOTECH,
UNICOH, SEBCHEM, YUMING VALVE, LETONE, SAFEGAS and PENTA TECHSECURE. HACH (water analysis) and
INEOS (petrochemicals) in particular do more for a procurement engineer's confidence than any
photograph will.

They hold logo files for only two of the ten (LETONE and SAFEGAS), so the section is set as
uniform text rather than a ragged mix of logos and names. **Ask each principal for their brand
assets** — distributors get logo packs and high-res product photography free on request, and
that is also the fastest route to replacing the stock imagery.

**Why there is no logo wall yet.** Sourcing the missing eight from the open web was attempted
and abandoned: hach.com blocks automated requests (403), injecta.it, turbotech.com and
unicoh.co.kr don't resolve from here, and SEBCHEM and PENTA TECHSECURE have no domain given
anywhere on CDE's site. That caps a scraped logo wall at roughly four of ten, which reads as
unfinished rather than credible — worse than the clean text the section has now. There's also a
permissions point: displaying a principal's mark to show you distribute their products is normal
trade practice, but the mark still belongs to them, and a logo pack comes with usage rules worth
having in writing. Request the assets; the wall is a twenty-minute job once they arrive.

**Their own product images are now used, at the only size they can support.** The eight images on
their Products & Services page are 187–458px catalogue thumbnails of 8–22KB. They cannot carry a
hero or a banner, so they appear as 64px square thumbnails on the six product cards, cropped from
the centre — every one downscaled or upscaled by no more than 1.15×.

One was rejected: `Picture4.jpg` (cooling towers) **carries a stock-library watermark badge**,
which suggests it was taken without a licence. It should come off their live site too.

The others are almost certainly manufacturer catalogue shots rather than CDE's own — normal
enough in distribution, but worth confirming with the principals rather than assuming.

## Photography — placeholders, and they must be replaced

The site had no images at all, which is what the client reacted to. Five photographs now
carry it. **All five are stock and none of them show CDE.** They are there so the page reads
as a finished design; they are not evidence of anything.

| Position | File | Shows |
|---|---|---|
| Hero background | `hero-plant.jpg` | Petrochemical plant at blue hour |
| About | `water-treatment.jpg` | Aerial of clarifiers and filter beds |
| Products & Services | `laboratory.jpg` | Analyst at a lab bench |
| IT Services band | `it-network.jpg` | Network cabling (dark, used as texture) |
| Contact | `doha.jpg` | Doha skyline |

Source: [Unsplash](https://unsplash.com), under the Unsplash License — free for commercial
use, no attribution required, no permission needed. The originals are
`images.unsplash.com/photo-…` at these IDs:

```
hero-plant       1588011930968-eadac80e6a5a
water-treatment  1533077162801-86490c593afb
laboratory       1581093577421-f561a654a353
it-network       1558494949-ef010cbdcc31
doha             1662050196100-6f8afc83d585
```

The four IT Services cards also carry stock thumbnails, same licence:

```
products/it-web.jpg      1487014679447-9f8336841d58   website on a laptop
products/it-support.jpg  1573164713988-8665fc963095   staff in a server room
products/it-systems.jpg  1554224155-1696413565d3      invoices and paperwork
products/it-brand.jpg    1530435460869-d13625c69bbf   printed brand identity sheets
```

**Note the mix in `assets/products/`.** The six `water/process/carbon/equipment/dosing/lab`
thumbnails are crops of **CDE's own catalogue images**; the four `it-*` ones are **stock**.
Only the second group needs replacing.

Selection rules applied, worth keeping if these get swapped: nothing showing another
company's branding (several otherwise-good industrial shots were rejected for visible
workwear logos), nothing showing heavy emissions on a site selling water treatment, and
a blue-dominant hero so the photograph sits inside the existing gradient rather than
fighting it.

**Replace these with CDE's own photography before launch.** A buyer who reverse-image-searches
a "plant" photo and finds it on a stock library has learned something you didn't want to
teach them. Priority order: their own dosing skids and installed analyzers, a lab they
equipped, their team, their Doha premises.

---

## Before this goes live — content still needed

| Gap | Note |
|---|---|
| Vector logo | The PNGs work on screen; print needs the original AI/EPS/SVG |
| Year established | Hero eyebrow says "Established in Qatar" — a date would be stronger |
| Client names / logos | Their nav has a "Customers" link, and the page behind it returns 404 — worth telling them regardless of this project |
| Principal brand assets | Only 2 of 10 suppliers have logo files on their site; the rest will supply them free on request |
| Supplier & principal brands | They have a Suppliers page; the brands they represent are a credibility asset worth showing |
| **Real photography** | The five images on the page are stock placeholders — see above |
| IT case study | Even one before/after would de-risk the new offering enormously |
| CR number and any ISO certifications | Standard trust signals for Qatari industrial procurement |

**On capability claims:** every service listed is deliverable today. The earlier industrial
digitalisation content (SCADA, LIMS, historians, predictive maintenance, OT security) was
removed precisely because it wasn't — it was inferred from CDE's product catalogue rather than
from anything they'd said they could do. If CDE later partners with an automation
integrator, that content can come back; until then it stays off the site.

**The one claim still worth checking:** the site says "an established Qatari company with
premises in Doha and a client base across the country's largest industries." That's taken from
their own About page, but confirm they're comfortable with the wording — and get the founding
year, which would strengthen it considerably.

---

## Technical notes

- `index.html` plus an `assets/` folder — no build step and no dependencies, but no longer a
  single file, because the client asked for photography and base64-embedding ~1.2MB of JPEG
  would be worse than a folder. Still opens straight from disk. Fonts load from Google Fonts.
- The contact section embeds Google Maps via the keyless `maps?q=…&output=embed` form, so it
  needs no Google Cloud API key or billing account. It is a third-party iframe that sets cookies,
  which matters if they ever want a cookie banner or a strict privacy policy. Styled maps, custom
  markers or guaranteed API stability would require the Maps Embed API and a key.
- The enquiry form opens a pre-filled `mailto:` to `info@chemicaldynamicsqatar.com`. Wire it
  to a real form handler (Formspree, Web3Forms, or their host) before launch — `mailto:` is
  fine for a demo but loses leads in practice.
- Contact details, address, phone and socials are taken from their live site and are real.
- Their current site is WordPress 6.4.8 built by Tricasol. If they want to keep WordPress,
  this works as a design direction to rebuild against rather than a drop-in replacement.
- An Arabic version is worth quoting separately — their buyers are Qatari industrial firms
  and none of the current site is bilingual.

## Sources

- [Chemical Dynamics Qatar — Home](https://chemicaldynamicsqatar.com/)
- [About CDE](https://chemicaldynamicsqatar.com/about-us/)
- [Products & Services](https://chemicaldynamicsqatar.com/products-services/)
- [Contact Us](https://chemicaldynamicsqatar.com/contact-us/)
- [Qatar e-Invoicing: Law and regulations approved — PwC Middle East](https://www.pwc.com/m1/en/services/tax/middle-east-tax-news-alerts/2026/qatar-e-invoicing-law-and-regulations-approved.html)
