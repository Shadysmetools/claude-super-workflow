---
name: claude-design
description: How to design with Claude - which design skills to reach for, how to build and publish Artifacts, how to render charts and diagrams that read as one system, and the frontend-design principles that stop generated UI looking templated. Routes between frontend-design, impeccable, ui-ux-pro-max, dataviz, artifact-design, and your project's design-system skill (whichever are installed) instead of duplicating them.
when_to_use: design, redesign, UI, UX, visual, layout, typography, spacing, color, palette, theme, dark mode, component, design system, tokens, accessibility, a11y, contrast, responsive, motion, animation, micro-interaction, empty state, error state, chart, graph, dashboard, data viz, mockup, prototype, artifact, publish a page, landing page, style guide, brand, which design skill.
user-invocable: true
---

# Designing with Claude

Claude Code has several strong design skills available (install the ones you use; each row below applies only if it is installed). **The most common failure is not
missing knowledge — it is reaching for the wrong one, or writing UI with none of them loaded.**
This page routes; the depth lives in the skills it points to.

---

## Router — pick one, then follow it

| The ask | Use | Not |
|---|---|---|
| New UI, needs a distinctive visual direction | **`frontend-design`** | Generic component scaffolding |
| Existing UI to critique, polish, harden, or make bolder/quieter | **`impeccable`** | A rewrite |
| Need concrete styles, palettes, font pairings, or stack-specific patterns | **`ui-ux-pro-max`** (67 styles, 161 palettes, 57 pairings, 21 stacks) | Inventing a palette |
| **Any** chart, graph, plot, dashboard, stat tile, or KPI row | **`dataviz`** — load it *before* the first line of chart code | Picking chart colors ad hoc |
| Publishing a shareable page on claude.ai | **`artifact-design`**, then the Artifact tool | Hand-rolling HTML |
| Your product's own tokens and components | Your **design-system / brand** skill or doc (list it in `.superworkflow.json` `contextFiles`) | New one-off components |

**If two apply, process-shaping skills come first.** `frontend-design` or `impeccable` sets the
direction; `ui-ux-pro-max` and `dataviz` supply the specifics.

---

## Non-negotiables

**Charts: load `dataviz` before writing chart code.** Not after, not "if it looks off". It covers
the form heuristic, an accessible color formula with a runnable validator, mark specs, and
interaction rules — and it applies to *every* medium: HTML/React artifacts, inline SVG,
matplotlib, plotly, d3, Recharts, or an image you render and upload.

**Theme-aware or it is not done.** Anything published or shipped must work in light *and* dark.
Use `@media (prefers-color-scheme: dark)` as the default signal plus
`:root[data-theme="dark"]` / `:root[data-theme="light"]` overrides, and make sure the explicit
override wins in both directions.

**Responsive means the body never scrolls sideways.** Relative units, flex/grid,
`max-width: 100%` on images. Wide things — tables, diagrams, code blocks — scroll inside their own
`overflow-x: auto` container.

**Contrast is a requirement, not a preference.** Check it on the actual background, in both
themes. A palette that only works in light mode is half a palette.

---

## Project-specific (fill in for your repo)

Put these in your `rulesFile` or a context file so the designer and full-stack roles load them:
- Where your UI primitives live, and whether the component CLI works or the components are
  hand-vendored (if vendored, edit them directly — don't re-run the generator).
- Your styling stack and variant pattern (e.g. Tailwind + `cva`) — follow it rather than
  inventing a new prop API.
- Which surfaces are **human-gated** (brand, design system, primary user-visible copy). Flag
  them in the PR body up front rather than discovering it at promotion.
- How hardcoded colors become tokens. If you are adding a raw hex, ask why it is not a token.

---

## Artifacts

Load **`artifact-design`** before writing the page; it calibrates how much design investment the
request warrants.

Mechanics that bite:
- **Strict CSP.** No CDN scripts, external stylesheets, remote fonts, remote images, fetch/XHR/
  WebSockets. Inline all CSS/JS; embed assets as `data:` URIs.
- Mermaid renders **natively** — ` ```mermaid ` fences in markdown, `<pre class="mermaid">` in
  HTML. Do not import a library for it.
- Write page content only — no `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>`; it is wrapped at
  publish time.
- A stable `<title>` and a **stable favicon** across redeploys — users find the tab by its icon, so
  a changed favicon reads as a different page.
- Re-publishing the **same file path** updates in place. A different path mints a new URL.

⚠️ **Never publish** pages impersonating a real person or organization, fabricated records or
reviews presented as genuine, or anything collecting credentials. This holds regardless of stated
purpose. Build it as a file and let the user decide.

---

## What separates good from templated

The recurring tell of generated UI is that every decision is the default: system font stack,
`#3b82f6` primary, uniform 16px spacing, cards for everything, one weight of hierarchy.

- **Commit to a direction.** Pick a typographic voice and a spatial rhythm and hold them. A
  consistent opinionated choice beats a safe inconsistent one.
- **Hierarchy through contrast, not just size.** Weight, color, spacing, and density all carry it.
- **Design the empty, loading, error, and too-much-data states.** They are most of real usage, and
  every pending UI state needs a reachable failure state — a spinner with no error path is a bug.
- **Motion should explain, not decorate** — where something came from, what changed. If it does
  not answer one of those, cut it.
- **Copy is design.** A precise sentence in an empty state outperforms an illustration.

Design against real content — real names, real lengths, and every language and script your users
actually write (including right-to-left). A layout that only survives short English strings will
break in production.
