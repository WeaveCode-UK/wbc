# @wbc/shared — split plan (ACH-005 codigo-manutenibilidade)

The audit run `codigo-manutenibilidade/2026-04-18_21-45-58` flagged
`@wbc/shared` as an incoherent grab-bag (theme colours next to circuit
breaker and outbox service). The long-term plan is to split into four
dedicated packages so tree-shaking works and the dependency graph stays
honest:

| Target package           | Current contents                                                |
| ------------------------ | --------------------------------------------------------------- |
| `@wbc/design-tokens`     | `src/theme/*`                                                   |
| `@wbc/shared-resilience` | `src/circuit-breaker.ts`, `src/resilience/*`                    |
| `@wbc/shared-events`     | `src/events/*`                                                  |
| `@wbc/shared-types`      | `src/types/*`, `src/context/*`, env/logger/ redaction utilities |

## This PR (partial)

Landed the **subpath exports** in `packages/shared/package.json` so
consumers that want a single concern can import just that slice without
pulling the whole barrel (and therefore avoiding e.g. `async_hooks` being
dragged into a client-side Sentry config — that already bit us once on
ACH-021 of the seguranca run). New usage:

```ts
// tree-shaking-friendly
import { redactSentryEvent } from "@wbc/shared/sentry-redaction";
import { createLogger } from "@wbc/shared/logger";
import { OUTBOX_POLL_INTERVAL_MS } from "@wbc/shared/constants/timings";
```

The root barrel (`@wbc/shared`) keeps working for backwards compatibility.

## Follow-up (not in this PR)

1. Create the four target packages in the workspace (`packages/design-tokens`,
   `packages/shared-resilience`, `packages/shared-events`, `packages/shared-types`).
2. Move files; update consumers one-by-one (most imports already use the
   subpaths introduced here, which makes the move mechanical).
3. Retire `@wbc/shared` or reduce it to a single-file re-export for legacy
   consumers during the transition.
