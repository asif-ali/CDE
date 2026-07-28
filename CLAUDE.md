# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A single-page pitch site for **Chemical Dynamics Enterprises WLL** (CDE), a Doha-based supplier of
chemicals, laboratory equipment and online analyzers. It proposes two things at once: formalising
the CDE brand, and adding a digital/IT division (**CDE Digital**) alongside the existing chemicals
business (**CDE Process**).

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
"New from CDE" band → Digital Solutions → Why CDE → Contact → footer. Sections are linked by
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
| `--teal` | `#25AFB4` | Brand accent — used for the **Process/chemicals** side |
| `--blue` | `#2480C3` | Secondary accent — used for the **Digital** side |
| `--grey` | `#858A9F` | Body copy |
| `--slab` | Roboto Slab | Headings only |
| `--sans` | Roboto | Body copy (slab serif is too heavy for long spec lists) |

Class names are terse and reused rather than semantic-per-section: `.wrap` (max-width container),
`.sh` (section heading block), `.c` (card), `.st` (numbered step), `.btn`, `.eyebrow`, `.rule`.
A trailing `.b` modifier switches a component from teal to blue — `.c.b`, `.sh.b`, `.rule.b`.
That teal/blue split is load-bearing: it visually separates the chemicals catalogue from the new
digital division while keeping both inside the client's existing palette. Preserve it.

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
- The positioning line is *"from the dosing skid to the dashboard"*: Digital is framed as selling
  more into accounts CDE already owns, never as diversification away from chemicals.
- Digital section ordering (Plant & Process → Laboratory → Business Systems) runs from
  "closest to what they already do" outwards. Keep that order.

## Known placeholders

The header/footer logo SVG is an approximation of the client's real circular molecular emblem and
should be swapped for the real asset. The contact form is `mailto:`-only. `README.md` ("Before this
goes live") lists the remaining content gaps — real logo, year established, client names, supplier
brands, photography, a Digital case study, CR number and ISO certifications.
