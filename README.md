# CDE — rebrand and diversification concept

A single-page site to present to Chemical Dynamics Enterprises WLL: the CDE brand formalised,
the existing chemicals business intact, and a new digital division alongside it.

`index.html` — self-contained, no build step, no dependencies. Open it in a browser.

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

### 2. Divisions, not a renaming

The legal entity stays **Chemical Dynamics Enterprises WLL** — no CR change, no supplier
paperwork, no disruption to certifications, LinkedIn or existing contracts. What changes is
the trading presentation:

- **CDE Process** — the existing chemicals, equipment and instruments business
- **CDE Digital** — the new systems division

The three letters carry the brand; the full name recedes to the footer and legal documents.
This matters because "Chemical Dynamics Enterprises" argues against diversification every
time it's said out loud. "CDE" doesn't.

### 3. Why the IT division isn't a random bolt-on

This is the part that makes the pitch land. CDE already sells:

- TOC, COD/BOD, chlorine dioxide and online laser turbidity analyzers
- pH, conductivity and ORP controllers, online scale monitors
- dissolved oxygen sensors
- automated dosing skids for bulk oil & gas
- and their own Products page already advertises *"automatic control and process
  integration services"*

There is a digital business sitting inside the chemicals business that nobody has named.
Every one of those instruments produces data that currently goes into a logbook.

So CDE Digital isn't diversification away from chemicals — it's **selling more into accounts
they already own**. They don't need to win a new client to sell a SCADA project; they need to
call the plant manager they spoke to last week about biocide. That is a fundamentally easier
sale than cold-selling IT in Doha, and it's the reason this works for CDE and wouldn't work
for a generic IT firm.

**The line to use:** *from the dosing skid to the dashboard.*

---

## What the Digital division covers

Three groups, deliberately ordered from "closest to what they already do" outwards:

| Group | Why CDE can credibly sell it |
|---|---|
| **Plant & Process Systems** — SCADA/HMI, remote analyzer monitoring, real-time dashboards, historians, predictive maintenance, OT/IT security | They installed the equipment. They know the process. |
| **Laboratory Systems** — LIMS, sample tracking, instrument interfacing, automated certificates of analysis, calibration scheduling | They equip the labs and supply the reagents. |
| **Business Systems** — ERP, e-invoicing readiness, inventory, document management, M365, cyber security, web | The general IT layer, sold on the back of an existing trusted relationship. |

**Near-term hook:** Qatar's Council of Ministers approved the e-invoicing law in May 2026,
with a phased rollout expected from 2027 — large firms first. CDE's clients are exactly the
large industrial firms in the first phase. That's a concrete, dated reason to start a
conversation this year rather than "someday".

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
teal, Digital uses blue — both already in their palette, so the new section reads as part of
the same brand rather than a bolt-on. Body copy is set in Roboto (same family lineage) rather
than Roboto Slab, purely because long specification lists in a slab serif get heavy; headings
stay Roboto Slab so the brand voice is unchanged.

**The homepage leads with what they sell, not with org structure.** An earlier draft opened on
"two divisions" — but nobody arriving cold cares how the company is organised internally. The
hero now carries their existing tagline, *"Renowned supplier of Chemicals, Laboratory Equipment
& Online Analyzers"*, with CDE above it. Digital appears after the full product catalogue,
introduced as *"New from CDE"* — an extension of an established business, which is both more
honest and more persuasive than presenting a startup division as an equal half of the company.

**Page order deliberately mirrors their existing navigation** — About CDE, Products & Services,
Contact — with one new section inserted. It's an addition to a site they already know, not a
rebuild they have to re-learn.

**The logo mark is a placeholder.** Their real one is a circular molecular emblem with
"Chemical Dynamics" in slate and "Enterprises WLL" in teal. The SVG here approximates it;
swap in the real asset (`chemical.png` on their server, or the source file) before presenting.

**The invented statistics are gone.** The current homepage shows "96% ACCURACY / 95%
SUCCESS-RATE / 92% BETTER DATA / 98% COST-EFFECTIVE" with nothing behind them. For an
industrial buyer these actively damage credibility — they're the kind of thing a procurement
engineer notices. They've been replaced with a factual company panel. If they want metrics
back, they need real ones (years trading, sites served, client count).

**No Nexvera attribution anywhere.** CDE presents as a single integrated company, as agreed.

---

## Before this goes live — content still needed

| Gap | Note |
|---|---|
| Real CDE logo file | Currently a placeholder SVG mark |
| Year established | Hero eyebrow says "Established in Qatar" — a date would be stronger |
| Client names / logos | Their nav has a "Customers" link that goes nowhere |
| Supplier & principal brands | They have a Suppliers page; the brands they represent are a credibility asset worth showing |
| Photography | Plant, lab and team images — the current site's stock photos are weak |
| Digital case study | Even one before/after would de-risk the new division enormously |
| CR number and any ISO certifications | Standard trust signals for Qatari industrial procurement |

**One honest caveat to raise with them:** the site sells SCADA, LIMS and OT security. Before
publishing, CDE needs to be able to deliver or subcontract those credibly — an industrial
client will ask for references on the first call. Worth agreeing what's genuinely deliverable
in phase one versus what's aspirational, and trimming the list accordingly.

---

## Technical notes

- Single file, ~29KB, no dependencies. Fonts load from Google Fonts.
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
