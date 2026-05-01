# WeaveCode Design System

> **Software, sewn to fit.** WeaveCode weaves code the way a tailor stitches fabric — precise, custom, built to last.

A complete brand and product system: tokens, type, components, templates, and the rules that hold it together. This is the **single source of truth** — for designers, for engineers, and for AI agents working on WeaveCode surfaces.

---

## TL;DR — the brand in one line

> **Calm, technical, electric purple on deep navy, with a Georgia italic `{moment}` once per surface.**

Inter does the work. Georgia provides the accent. Three verticals — **Beauty**, **Health**, **Business** — ride atop the institutional palette.

---

## Quick start

**For agents (Claude / Claude Code):** read `SKILL.md` and `CLAUDE.md`. Lift markup from `preview/`. Never invent values.

**For designers:** browse the **Design System** tab on this project, or open files in `preview/` directly.

**For engineers:**

```html
<link rel="stylesheet" href="/weavecode/colors_and_type.css" />
```

```ts
// or in a bundler
import "@/weavecode/colors_and_type.css";
```

Then use `var(--wc-*)` and the semantic classes throughout. Never hard-code hex.

---

## What's in this folder

```
README.md                    ← brand reference (you are here)
SKILL.md                     ← agent skill manifest + copy-paste recipes
CLAUDE.md                    ← drop-in instructions for any repo
colors_and_type.css          ← every design token + @font-face

assets/
  logos/                     ← vertical lockup, {W} mark, square logo
  grafismos/                 ← brand graphics (glows, orbs, dot patterns)

fonts/                       ← Inter (Thin → Black) + Georgia TTFs

preview/                     ← 40+ static HTML cards, one per token/component/template
ui_kits/
  weavecode-web/             ← marketing-site UI kit (hi-fi React + JSX)
```

**40+ preview cards** cover: brand (logo, marks, grafismos, icons), colors (institutional, products, scales, semantic), type (families, scale, display), spacing (scale, radii, shadows), backgrounds (screens, heroes, app surfaces, mobile), components (every primitive + shell + page header + container + pagination), templates (dashboard, auth, settings), and foundations (motion, interactions, responsive, accessibility). Plus a designer + engineer documentation card.

---

## 1 · Brand

A software / product studio. The name fuses **weave** (textile, craft, careful interlacing) with **code** (the literal medium). The needle-and-thread piercing the "A" of WEAVE is the core symbol.

**Three values:**

- **Craft over scaffolding** — every product is sewn deliberately.
- **Calm, technical confidence** — purple authority, not flashy hype.
- **Verticalised expertise** — distinct accents for each sub-brand.

**Three product verticals:**

| Vertical | Token           | Hex       |
| -------- | --------------- | --------- |
| Beauty   | `--wc-beauty`   | `#D161B9` |
| Health   | `--wc-health`   | `#00C479` |
| Business | `--wc-business` | `#0030B7` |

---

## 2 · Visual foundations

### Colors

Three institutional colors + soft white, plus three product accents.

| Token            | Role                                             | Hex       |
| ---------------- | ------------------------------------------------ | --------- |
| `--wc-purple`    | Primary brand. CTAs, links, focus accents.       | `#8127E8` |
| `--wc-deep-blue` | Dark canvas, hero surfaces, "trust" tone.        | `#0B134F` |
| `--wc-orange`    | Energy accent — italics, focus rings, sparingly. | `#FF6600` |
| `--wc-white`     | Soft white. Default content background.          | `#F9F9F9` |

Full purple and deep-blue scales (`--wc-purple-50…900`, `--wc-blue-50…900`) live in `colors_and_type.css`. The 500 step is brand-correct base.

**Vibe:** cool, saturated, electric purple against navy. Orange is a single accent — never co-equal.

### Type

Two families. Strict.

- **Inter** does almost everything — Light (300) for body, Medium (500) and Semibold (600) for titles.
- **Georgia Italic** is reserved for `{moments}` — the same family as `{code}` in the logo.

**Never** set a heading and a body in Georgia on the same surface. Georgia is punctuation, never paragraph.

### Spacing

Strict 4px grid: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`. Sections breathe — 64–96px between major sections, 24–32px inside cards.

### Backgrounds

Five canonical treatments (see `preview/backgrounds-*.html`):

1. **Soft white (`#F9F9F9`)** — default content
2. **Deep blue dot-grid** — signature tech backdrop
3. **Purple dot-grid** — full-bleed brand moments
4. **Glow gradients** — radial purple-on-navy or white-on-purple
5. **Luminous orbs** — circular gradients, decorative only

No repeating illustrations. No hand-drawn textures. No warm photography.

### Borders, radii, shadows

- **Radii:** `8px` (buttons), `12px` (inputs), `16px` (cards), `24px` (modals).
- **Borders:** 1px hairlines in `--wc-neutral-200` on light, `rgba(255,255,255,0.10)` on dark. Color comes from background, not stroke.
- **Shadows:** purple-tinted (`rgba(11,19,79, 0.06–0.18)`), never gray. `--wc-shadow-glow` for hero CTA halo, `--wc-shadow-focus` for keyboard rings.

### Motion

- **Durations:** `120ms` micro · `180ms` UI · `240ms` modal/drawer · `320ms` page.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` default. Spring reserved for celebratory moments.
- **Fades > slides > bounces.** WeaveCode is calm.
- **Reduced motion** respected — fade or instant fallback.

### Layout

- 12-column grid. Max content width `1200px`; marketing up to `1440px`.
- Frosted blur only on floating nav over imagery.
- Glass = `rgba(255,255,255,0.08)` over dark with 1px white-10% inner border.

### Accessibility

- WCAG AA on every text/background combination — see `preview/foundations-accessibility.html`.
- Focus = 3px orange outline, 2px offset.
- Touch targets ≥ 44×44px.
- Semantic HTML; ARIA only when HTML can't.

---

## 3 · Iconography

**System.** Line icons, 1.5–2px stroke, round caps, 24×24 grid. **Lucide** is the canonical stand-in (see `preview/brand-icons.html`).

- **Sizes:** `14 · 18 · 22 · 28 · 40` (px)
- **Color:** inherits `currentColor`. Default `--wc-fg-2`; brand purple only on brand surfaces.
- **No emoji** in product UI.
- **Brand glyph:** the curly braces `{ }` from Georgia italic. One pair per surface, max.

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="needle"></i>
<script>
  lucide.createIcons();
</script>
```

---

## 4 · Voice & content

**Voice.** Quietly confident. We speak like an experienced developer who's also a designer — precise, plain, never breathless. No hype, no rocket emojis.

**Person.** "We" for WeaveCode, "you" for the reader.

**Casing.**

- **Sentence case** for headings and buttons.
- **UPPERCASE** only for short eyebrow labels with `letter-spacing: 0.08em`.
- **Title Case** never — except proper nouns and product names.

**Voice — write / don't write:**

| ✅ Good                                                      | ❌ Avoid                                      |
| ------------------------------------------------------------ | --------------------------------------------- |
| "Software, sewn to fit."                                     | "Revolutionary cloud-native AI solutions"     |
| "We build what your team would build, if they had the time." | "We unlock synergies across your tech stack." |
| "Get in touch"                                               | "Let's chat! 🚀"                              |
| "We couldn't save your changes. Try again."                  | "Error."                                      |
| "No projects yet. Start your first one to see it here."      | "Empty."                                      |

**Microcopy patterns:**

- Empty states get one-line _what_ + one-line _why / next step_.
- Errors say _what failed_, _why_ (when known), _what to do_.
- Buttons start with verbs. Success messages start with the noun.

**Languages.** PT-BR primary, EN secondary. Same calm voice in both.

**The Georgia `{moment}`.** Once per surface, drop a short phrase or noun into Georgia italic — wrapped in `{ }`. It mirrors `{code}` in the logo.

---

## 5 · Tokens at a glance

```css
/* brand */
--wc-purple: #8127e8;
--wc-deep-blue: #0b134f;
--wc-orange: #ff6600;
--wc-white: #f9f9f9;

/* products */
--wc-beauty: #d161b9;
--wc-health: #00c479;
--wc-business: #0030b7;

/* type */
--wc-font-sans: "Inter", system-ui, sans-serif;
--wc-font-serif: Georgia, serif;

/* radii */
--wc-radius-sm: 8px;
--wc-radius-md: 12px;
--wc-radius-lg: 16px;
--wc-radius-xl: 24px;

/* motion */
--wc-dur-2: 180ms;
--wc-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
```

Full set in [`colors_and_type.css`](./colors_and_type.css).

---

## 6 · UI Kits

| Kit               | Path                     | Purpose                                                                    |
| ----------------- | ------------------------ | -------------------------------------------------------------------------- |
| **WeaveCode Web** | `ui_kits/weavecode-web/` | Marketing site — Header, Hero, Services, Verticals, CaseStudy, CTA, Footer |

Open `ui_kits/weavecode-web/index.html` for a click-thru preview.

---

## 7 · Using this system

### In other Claude projects

Tell the agent: **"Use the WeaveCode design system from this project: `[paste link]`"**. The agent will copy what it needs.

### In Claude Code / a real repo

1. Copy this folder to `weavecode/` at the root of your repo.
2. Drop `CLAUDE.md` next to it (already provided here).
3. Import the CSS once: `import "@/weavecode/colors_and_type.css";`
4. The agent will read `CLAUDE.md` automatically and follow the rules.

### Starting a new Claude project from scratch

This project is **published as a template**. Start a new project from it and everything is pre-loaded.

---

## 8 · Source materials

Reconstructed from the founder's brand kit:

| Source                               | Used for                        |
| ------------------------------------ | ------------------------------- |
| `WEAVECODE-LOGOTIPO-VERTICAL@2x.png` | Primary vertical lockup         |
| `WEAVECODE-1X1-1@2x.png`             | `{ W }` mark                    |
| `WEAVECODE-1X1-2@2x.png`             | Square logo (needle + `{code}`) |
| `Weave Code - Cores.pdf`             | Color palette                   |
| `Weave Code - Tipografia.pdf`        | Type system                     |
| `WEAVECODE-GRAFISMO-1…7@2x.png`      | Brand graphics                  |

Live copies in `assets/logos/` and `assets/grafismos/`.

---

## 9 · Caveats & open questions

- **No production codebase or Figma was provided.** The web UI kit is reasoned from the brand kit + studio conventions. Attach a real codebase or Figma and I'll replace the inferred shapes with the real ones.
- **Product verticals are colors only.** No sub-brand logos, taglines, or screens yet.
- **Iconography uses Lucide as a stand-in.** Name a preferred set and I'll swap.
- **Marketing copy is bilingual-friendly but currently English.** Confirm canonical voice (PT-BR / EN / both).

---

## 10 · Contributing

**One reason to change.** A pull request adds, edits, or removes one token / component. Bundled changes get sent back.
**Document on commit.** If it isn't in `preview/` and the README, it doesn't exist.
**Two-eyes minimum.** One designer + one engineer must approve.
**Brand changes go through marketing.** Type, primary colors, logo — never unilateral.

---

> _Calm, technical, electric purple on deep navy, with a Georgia italic `{moment}` once per surface._
