// T7.1 — JSON Schema snapshot of every Zod schema exported by
// @wbc/validators. Detects breaking-change drift between apps/api and
// apps/mobile / apps/web. Mobile cannot rebuild against api types in
// real time — a removed field, a widened union, a renamed property
// breaks the wire silently.
//
// On legitimate change run `pnpm vitest -u packages/validators` and
// review the JSON diff before committing the new snapshot.
import { describe, it, expect } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as validators from "../index";

describe("tRPC contract — Zod → JSON Schema snapshot", () => {
  it("locks the public shape of every exported Zod schema", () => {
    const out: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(validators)) {
      // Heuristic: only schemas (objects with `_def`) — not constants
      // like TEXT_SHORT_MAX or types/utility functions.
      if (
        value &&
        typeof value === "object" &&
        "_def" in value &&
        "parse" in (value as object)
      ) {
        try {
          out[name] = zodToJsonSchema(value as never, {
            target: "jsonSchema7",
            $refStrategy: "none",
          });
        } catch (err) {
          // Some schemas (effects/refinements) may not serialise;
          // record the failure rather than blowing up the snapshot.
          out[name] = {
            __unserialisable: (err as Error).message.slice(0, 200),
          };
        }
      }
    }
    expect(out).toMatchSnapshot();
  });
});
