import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// T4.5 — Token-only enforcement.
// Per CLAUDE.md > Hard rules: "Tokens only. var(--wc-purple), never #8127E8."
// We scan every *.tsx file under apps/web/src and packages/ui/src looking
// for raw hex literals (#abc / #abcdef / #abcdefab). Any hex that is NOT
// an explicit allow-listed exception is a build break.
//
// Allow-list:
//   • Files matching `colors_and_type.css` (the design tokens themselves
//     necessarily contain hex). We exclude them via the file-extension
//     filter below — only *.tsx is scanned, never CSS.
//   • Specific known exceptions (icon strokes etc) listed below by
//     {file, line content snippet} pair if/when found.

const ROOT = join(__dirname, "..", "..", "..", "..");

const SCAN_DIRS = [
  join(ROOT, "apps", "web", "src"),
  join(ROOT, "packages", "ui", "src"),
];

// Known hex literals that pre-date this rule. We snapshot them here so
// the suite stays green today AND starts failing the second a new hex
// leaks in. To remove an entry: refactor the source file to use a
// `var(--wc-*)` token, then drop the row below.
//
// Owners are encouraged to chip away at this list; it should only ever
// shrink, never grow. Audit run 2026-05-03.
const ALLOW: Array<{ file: string; hex: string }> = [
  // Brand error/empty surfaces — pre-token error boundary.
  { file: "apps/web/src/app/(dashboard)/error.tsx", hex: "#FCDBDC" },
  { file: "apps/web/src/app/(dashboard)/error.tsx", hex: "#9F2A2D" },
  { file: "apps/web/src/components/error-boundary.tsx", hex: "#FCDBDC" },
  { file: "apps/web/src/components/error-boundary.tsx", hex: "#9F2A2D" },
  // /settings/theme picker — by design these chips display raw brand swatches.
  {
    file: "apps/web/src/app/(dashboard)/settings/theme/page.tsx",
    hex: "#1A0F33",
  },
  {
    file: "apps/web/src/app/(dashboard)/settings/theme/page.tsx",
    hex: "#8127E8",
  },
  {
    file: "apps/web/src/app/(dashboard)/settings/theme/page.tsx",
    hex: "#150A10",
  },
  {
    file: "apps/web/src/app/(dashboard)/settings/theme/page.tsx",
    hex: "#E91E8C",
  },
  // Tag color picker — same rationale, swatches must show literal hex.
  { file: "apps/web/src/app/(dashboard)/tags/page.tsx", hex: "#8127E8" },
  { file: "apps/web/src/app/(dashboard)/tags/page.tsx", hex: "#999" },
  // Server-rendered global-error: cannot read CSS vars (no client CSS).
  { file: "apps/web/src/app/global-error.tsx", hex: "#0B1220" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#E5E7EB" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#111827" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#1F2937" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#3F1D20" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#FCA5A5" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#9CA3AF" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#8127E8" },
  { file: "apps/web/src/app/global-error.tsx", hex: "#FFFFFF" },
  // Google G logo paths — third-party brand colors required by their guidelines.
  {
    file: "apps/web/src/components/auth/google-login-button.tsx",
    hex: "#4285F4",
  },
  {
    file: "apps/web/src/components/auth/google-login-button.tsx",
    hex: "#34A853",
  },
  {
    file: "apps/web/src/components/auth/google-login-button.tsx",
    hex: "#FBBC05",
  },
  {
    file: "apps/web/src/components/auth/google-login-button.tsx",
    hex: "#EA4335",
  },
  // Sidebar gradient stop — TODO: extract to token (issue #TBD).
  { file: "apps/web/src/components/sidebar.tsx", hex: "#fff" },
];

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next" || name === "dist")
      continue;
    if (name.startsWith(".")) continue;
    if (name === "__tests__") continue;
    const full = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      yield full;
    }
  }
}

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;

interface Violation {
  file: string;
  line: number;
  text: string;
  match: string;
}

describe("no-hex-outside-tokens", () => {
  it("no .tsx/.ts file under apps/web/src or packages/ui/src contains a raw hex literal", () => {
    const violations: Violation[] = [];

    for (const dir of SCAN_DIRS) {
      for (const file of walk(dir)) {
        const text = readFileSync(file, "utf8");
        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] ?? "";
          // Skip lines that are comments — comments referencing colors
          // ("brand purple #8127E8") shouldn't fail the build.
          const trimmed = line.trim();
          if (
            trimmed.startsWith("//") ||
            trimmed.startsWith("*") ||
            trimmed.startsWith("/*")
          ) {
            continue;
          }
          let m: RegExpExecArray | null;
          HEX_RE.lastIndex = 0;
          while ((m = HEX_RE.exec(line)) !== null) {
            const match = m[0];
            // Must be 3, 4, 6 or 8 hex chars (after #) to look like color.
            const len = match.length - 1;
            if (len !== 3 && len !== 4 && len !== 6 && len !== 8) continue;

            // Allow-list check.
            const rel = file.slice(ROOT.length + 1);
            const allowed = ALLOW.some(
              (a) =>
                rel.endsWith(a.file) &&
                match.toLowerCase() === a.hex.toLowerCase(),
            );
            if (allowed) continue;

            violations.push({
              file: rel,
              line: i + 1,
              text: line.trim().slice(0, 120),
              match,
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      const summary = violations
        .slice(0, 25)
        .map((v) => `  ${v.file}:${v.line}  ${v.match}  → ${v.text}`)
        .join("\n");
      // eslint-disable-next-line no-console
      console.error(
        `Hex tokens leaked into source files:\n${summary}` +
          (violations.length > 25
            ? `\n  ...and ${violations.length - 25} more`
            : ""),
      );
    }
    expect(violations).toEqual([]);
  });
});
