---
name: weavecode-design
description: Use this skill to generate well-branded interfaces and assets for WeaveCode, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read `README.md` within this skill, and explore the other available files. Always use the existing tokens and components — do not invent colors, fonts, or spacing.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create static HTML files for the user. If working on production code, copy `colors_and_type.css` into the project, link it from your root layout, and use the CSS custom properties and semantic classes throughout.

If the user invokes this skill without context, ask what they want to build or design, then act as an expert designer outputting HTML artifacts _or_ production code.

## The brand in one line

**Calm, technical, electric purple on deep navy, with a Georgia italic `{moment}` once per surface.** Inter does the work; Georgia provides the accent. Three verticals (Beauty, Health, Business) ride atop the institutional palette.

## Key files

- `README.md` — full system reference (brand, content, visual foundations, iconography)
- `colors_and_type.css` — all design tokens (CSS vars, semantic classes, @font-face)
- `assets/logos/` — official logos (vertical lockup, {W} mark, square)
- `assets/grafismos/` — brand graphics (glow gradients, orbs, dot patterns)
- `fonts/` — Inter (Thin → Black) + Georgia TTFs
- `ui_kits/weavecode-web/` — marketing-site UI kit
- `preview/` — design-system review cards (cores, fontes, espaçamentos, componentes, templates, foundations)

## Core tokens (most-used)

```css
/* Brand */
--wc-deep-blue: #0b134f; /* navy — trust, depth, default dark surface */
--wc-purple: #8127e8; /* primary brand — buttons, links, focus */
--wc-orange: #ff6600; /* energy accent — Georgia italics, hover, focus rings */

/* Type */
--wc-font-sans: "Inter", system-ui, sans-serif;
--wc-font-serif: Georgia, serif; /* italic, only for {moments} */
--wc-font-mono: ui-monospace, monospace;

/* Radius / shadow / motion */
--wc-radius-md: 10px;
--wc-shadow-card: 0 4px 14px rgba(11, 19, 79, 0.08);
--wc-dur-base: 250ms;
```

## Copy-paste recipes

### Primary button

```html
<button class="wc-btn-primary">Get started →</button>
```

```css
.wc-btn-primary {
  background: var(--wc-purple);
  color: #fff;
  font: 500 14px/1.2 var(--wc-font-sans);
  padding: 10px 18px;
  border-radius: var(--wc-radius-md);
  border: none;
  cursor: pointer;
  transition:
    background var(--wc-dur-fast) ease-out,
    box-shadow var(--wc-dur-fast) ease-out;
}
.wc-btn-primary:hover {
  background: #9d4ef0;
  box-shadow: 0 4px 12px rgba(129, 39, 232, 0.35);
}
.wc-btn-primary:focus-visible {
  outline: 3px solid var(--wc-orange);
  outline-offset: 2px;
}
```

### Hero section (signature dot-grid + glow + orb)

```html
<section class="wc-hero">
  <div class="wc-hero-glow"></div>
  <div class="wc-hero-orb"></div>
  <div class="wc-hero-content">
    <span class="wc-eyebrow">Software studio</span>
    <h1>Software, <em>{sewn to fit}</em>.</h1>
    <p>
      We design and build calm, technical products for Beauty, Health, and
      Business.
    </p>
    <button class="wc-btn-primary">Start a project →</button>
  </div>
</section>
```

```css
.wc-hero {
  position: relative;
  overflow: hidden;
  padding: 96px 64px;
  background-color: var(--wc-deep-blue);
  background-image: radial-gradient(
    rgba(129, 39, 232, 0.55) 1px,
    transparent 1.2px
  );
  background-size: 14px 14px;
  color: #fff;
}
.wc-hero-glow {
  position: absolute;
  left: -10%;
  top: -20%;
  width: 60%;
  height: 140%;
  background: radial-gradient(
    ellipse at center,
    rgba(129, 39, 232, 0.85) 0%,
    rgba(129, 39, 232, 0.25) 40%,
    transparent 70%
  );
  filter: blur(24px);
  pointer-events: none;
}
.wc-hero-orb {
  position: absolute;
  right: -6%;
  bottom: -25%;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 32% 35%,
    #fff 0%,
    #d5b5fb 18%,
    #8127e8 55%,
    #2b1170 90%
  );
  pointer-events: none;
}
.wc-hero-content {
  position: relative;
  max-width: 640px;
}
.wc-hero h1 {
  font: 600 64px/1.05 var(--wc-font-sans);
  letter-spacing: -0.02em;
  margin: 12px 0 18px;
}
.wc-hero h1 em {
  font: italic 400 1em/1 var(--wc-font-serif);
  color: var(--wc-orange);
}
.wc-eyebrow {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}
```

### Color recipes (memorize these)

| Surface             | Background                  | Body text | Accent                 |
| ------------------- | --------------------------- | --------- | ---------------------- |
| Default light       | `#F9F9F9`                   | `#0E0E16` | `--wc-purple`          |
| Default dark / hero | `--wc-deep-blue`            | `#fff`    | `--wc-purple` (glow)   |
| Brand-loud          | `--wc-purple`               | `#fff`    | `--wc-orange` (italic) |
| Card on light       | `#fff` + `--wc-shadow-card` | `#0E0E16` | `--wc-purple` (CTA)    |

### The Georgia `{moment}` rule

**Once per surface.** Use Georgia italic to highlight a single noun in a headline, wrapped in `{ }`:

```html
<h1>Software, <em class="wc-moment">{sewn to fit}</em>.</h1>
```

```css
.wc-moment {
  font-family: var(--wc-font-serif);
  font-style: italic;
  font-weight: 400;
  color: var(--wc-orange); /* or --wc-purple on light surfaces */
}
```

Don't apply it to two phrases on the same surface. Don't bold it. Don't underline it. Let it whisper.

## Don'ts

- ❌ Hex codes outside the token palette
- ❌ Inter at less than 12px (mobile) or 13px (desktop body)
- ❌ Georgia outside `{ }` italic moments
- ❌ Drop shadows that aren't `--wc-shadow-*`
- ❌ Border-radius values that aren't `--wc-radius-*`
- ❌ Emoji as iconography (use line icons; see `preview/brand-icons.html`)
- ❌ Two primary CTAs on one surface
- ❌ Hand-coded gradients — use the brand graphics in `assets/grafismos/`

## Production setup (Next.js / React / vanilla)

1. Copy `colors_and_type.css` to `app/styles/` (or equivalent).
2. Copy `fonts/` and update the `@font-face` paths inside the CSS if needed.
3. Import once in your root layout: `import "./styles/colors_and_type.css";`
4. Use tokens via `var(--wc-*)` or the included semantic classes.
5. For components, lift markup from `preview/components-*.html` and `ui_kits/weavecode-web/*.jsx`.

## When in doubt

Open `preview/documentation.html` — it has the designer + engineer rules, anatomy, and contribution flow.
