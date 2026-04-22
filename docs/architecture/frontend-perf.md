# Frontend Performance (ACH-016/018/019/020 performance-escalabilidade)

Consolidated frontend guidance covering client-side hydration, code-
splitting, image optimisation, and ISR.

## `"use client"` inventory (ACH-016)

23 files in `apps/web/src/**` mark `"use client"`. Client Components
hydrate into the initial JS bundle; the more Client code you ship, the
worse TTI gets — particularly on 3G/4G. Rules:

- **Layouts default to Server Components.** If a provider wraps
  state that doesn't need client reactivity (Theme with CSS vars is
  fine on the server; Session data can be fetched server-side), keep
  it on the server.
- **Leaf Client boundaries.** A form using `react-hook-form` is
  Client — but its surrounding page doesn't have to be. Push the
  `"use client"` directive as far down the tree as possible.
- **Audit follow-up.** Add an ESLint custom rule that flags any file
  directly under `app/` routes with `"use client"` unless it's a form
  or interactive component. Start as a warning so existing files
  surface; tighten to error once cleaned up.

## Code splitting (ACH-018)

Zero uses of `next/dynamic` today. Modals, editors, and rich
components all live in the main bundle.

### How

```tsx
import dynamic from "next/dynamic";

const MessagesEditor = dynamic(() => import("@/components/messages-editor"), {
  ssr: false,
  loading: () => <Skeleton />,
});
```

### What to split

- Modals (never rendered until user opens them).
- Tinymce / Editor.js style rich editors.
- Charting libs (Recharts, Chart.js).
- Any component > 50 KB gzip.

### Measurement

`pnpm --filter @wbc/web analyze` (ACH-017) opens the bundle report;
split anything showing up in the top-10.

## ISR and SSG (ACH-019)

Landing pages and public catalogue should not SSR on every request.
Per-route:

```tsx
// apps/web/src/app/landing/page.tsx
export const revalidate = 3600; // rebuild every hour
```

For a user-facing catalogue preview (`/catalog/public/[slug]`):

```tsx
export async function generateStaticParams() {
  // Return a list of slugs to pre-render at build.
}
export const revalidate = 300;
```

Pair with a webhook-triggered `revalidatePath()` when a catalogue
publishes, so edits go live inside the TTL instead of at TTL expiry.

## `next/image` (ACH-020)

Zero uses today. Any `<img>` in the tree should be `<Image>`:

```tsx
import Image from "next/image";

<Image
  src={avatarUrl}
  alt={name}
  width={40}
  height={40}
  sizes="(max-width: 768px) 40px, 64px"
/>;
```

Gets you: webp/avif on supporting browsers, lazy loading, responsive
`srcset`, placeholder blur. Remote sources need to be allowed in
`next.config.mjs`:

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.seudominio.com.br' },
    { protocol: 'https', hostname: '*.supabase.co' },
  ],
}
```

## Follow-up

- Custom ESLint rule for `"use client"` audit.
- Dynamic-import a handful of known-heavy components (identified once
  analyze runs against the current bundle).
- Migrate landing page to ISR once its content stabilises.
- Migrate avatar / brand-logo renderers to `<Image>` as a single PR.
