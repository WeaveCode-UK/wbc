# WeaveCode Design System — Agent Instructions

This repo uses the **WeaveCode design system**. Any UI work — components, pages, prototypes, slides — must follow it. Do not invent colors, fonts, spacing, shadows, or radii.

## Setup (once per repo)

The design system lives in `weavecode/` at the root of this repo. If it is missing, ask the user to copy it from the WeaveCode Design System project.

Import the tokens once in your root layout:

```ts
// app/layout.tsx (Next.js) or src/main.tsx (Vite) etc.
import "@/weavecode/colors_and_type.css";
```

## Read these before any UI work

1. `weavecode/SKILL.md` — copy-paste recipes, do/don't list, the Georgia `{moment}` rule.
2. `weavecode/README.md` — full brand reference: voice, content, visual foundations.
3. `weavecode/colors_and_type.css` — every available token. Use `var(--wc-*)` exclusively.
4. `weavecode/preview/` — static HTML examples of every component, template, and foundation. **When in doubt, lift markup directly from here.**

## Hard rules

- ✅ **Tokens only.** `var(--wc-purple)`, never `#8127E8`.
- ✅ **Inter for UI**, **Georgia italic only for `{moments}`** — once per surface, on a single highlighted noun.
- ✅ **One primary CTA per surface.** Filled purple. Demote others.
- ✅ **Build all four states** for any async surface: loading, empty, error, success. See `weavecode/preview/components-skeleton.html`, `components-empty.html`, `components-error.html`.
- ✅ **Focus rings:** 3px orange, 2px offset, on every interactive element.
- ✅ **Touch targets ≥ 44×44px**, on every breakpoint.
- ✅ **Respect `prefers-reduced-motion`** — fall back to fade or instant.

- ❌ No hex outside the token palette.
- ❌ No emoji as iconography. Use the line icon set (`weavecode/preview/brand-icons.html`).
- ❌ No invented gradients — use the assets in `weavecode/assets/grafismos/`.
- ❌ No two primary CTAs on the same surface.

## The brand in one line

> Calm, technical, electric purple on deep navy, with a Georgia italic `{moment}` once per surface.

## Component reference

Every component you need has a static example in `weavecode/preview/`:

| Need                                        | File                            |
| ------------------------------------------- | ------------------------------- |
| Buttons                                     | `components-buttons.html`       |
| Inputs / Select / Checkbox / Radio / Switch | `components-inputs.html`        |
| Textarea + form section                     | `components-textarea-form.html` |
| Cards                                       | `components-cards.html`         |
| Badges                                      | `components-badges.html`        |
| Alerts                                      | `components-alerts.html`        |
| Toast                                       | `components-toast.html`         |
| Modal / Dialog                              | `components-modal.html`         |
| Drawer / Sheet                              | `components-drawer.html`        |
| Dropdown menu                               | `components-dropdown.html`      |
| Tabs                                        | `components-tabs.html`          |
| Table                                       | `components-table.html`         |
| Skeleton                                    | `components-skeleton.html`      |
| Empty state                                 | `components-empty.html`         |
| Error / 404                                 | `components-error.html`         |
| Tooltip                                     | `components-tooltip.html`       |
| App shell (sidebar + topbar)                | `components-shell.html`         |
| Page header                                 | `components-page-header.html`   |
| Container + 12-col grid                     | `components-container.html`     |
| Pagination                                  | `components-pagination.html`    |
| Hero                                        | `components-hero.html`          |

## Templates

Full-page references: `template-dashboard.html`, `template-auth.html`, `template-settings.html`.

## Foundations

`foundations-motion.html`, `foundations-interactions.html`, `foundations-responsive.html`, `foundations-accessibility.html`.

## When the design system is missing something

Ask before inventing. Open a discussion or note it in the PR. Do not silently extend the palette, scale, or component set.
