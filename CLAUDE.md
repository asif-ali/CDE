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

Everything lives in `index.html` (~580 lines): `<style>` in the head, markup, then a ~20-line
`<script>` at the bottom. Keep it that way — self-contained single file with no build step is a
requirement of the deliverable, not an accident. Do not introduce a bundler, framework, CSS file
or npm dependency.

Structure, top to bottom: sticky header → hero → industries strip → About → Products & Services →
"New from CDE" band → IT Services → Why CDE → Contact → footer. Sections are linked by
in-page anchors (`#about`, `#products`, `#digital`, `#why`, `#contact`); `scroll-padding-top`
compensates for the sticky header.

The only JavaScript: the footer year, and `sendEnquiry()`, which builds a `mailto:` to
`info@chemicaldynamicsqatar.com` from the contact form. This is placeholder behaviour — a real
form handler is needed before launch.

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
A trailing `.b` modifier switches a component from teal to blue — `.c.b`, `.sh.b`, `.rule.b`.
That teal/blue split is load-bearing: it visually separates the chemicals catalogue from the new
IT services while keeping both inside the client's existing palette. Preserve it.

Layout is CSS grid with `auto-fit`/`minmax`, so cards reflow without per-breakpoint rules. The
only explicit breakpoints are 1020px (nav links hide — note there is **no** mobile menu yet),
900px and 820px.

## Content rules

These come from decisions already made with the client; don't reverse them incidentally.

- The **legal entity stays "Chemical Dynamics Enterprises WLL"**. "CDE" is the trading brand; the
  full name belongs in the logo lockup, the About facts panel and the footer only.
- **No invented statistics.** The client's current site has unbacked percentage claims; removing
  them was a deliberate credibility decision. Only add metrics if given real ones.
- **No Nexvera attribution anywhere** — CDE presents as a single integrated company.
- Contact details, address, phone and social links are real and taken from the live site. Don't
  edit them without a source.
- **Only list services that are deliverable today.** This is the most important rule here. An
  earlier draft sold industrial digitalisation — SCADA on the dosing skids, LIMS in the labs,
  data historians, predictive maintenance, OT/IT security. None of it was deliverable, and none
  of it came from CDE; it had been inferred from their product catalogue. It was removed in
  `f412ea4`. Do not reintroduce that class of claim unless CDE partners with an automation
  integrator. The only automation wording CDE themselves publish is *"Automatic control and
  process Integration services"*, on their dosing pumps page.
- The four IT Services groups (Websites & Applications, Business IT & Security, Business Systems
  & Compliance, Brand & Digital Marketing) are drawn from the real Nexvera service stack.
  New services belong on the page only if they come from that stack.
- **POS systems (Talabat/Snoonu/Rafeeq) and TikTok/Snapchat campaigns are deliberately omitted**
  even though Nexvera offers them — they target cafés and retail, and CDE's audience is oil &
  gas, power and fertiliser. Social is framed LinkedIn-first for the same reason. Adding them
  back is a strategy decision, not a copy-paste.
- The pitch is a **distribution** advantage, not a capability one: "you already buy from us and
  you need this anyway", not "we're the best IT firm in Qatar". Don't write copy claiming
  technical superiority or a proprietary edge.

## Known placeholders

The header/footer logo SVG is an approximation of the client's real circular molecular emblem and
should be swapped for the real asset. The contact form is `mailto:`-only. `README.md` ("Before this
goes live") lists the remaining content gaps — real logo, year established, client names, supplier
brands, photography, an IT case study, CR number and ISO certifications.

One live claim still needs checking with CDE: *"an established Qatari company with premises in
Doha and a client base across the country's largest industries"* in the "Why CDE" section.
