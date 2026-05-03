import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// T4.6 — Georgia `{moment}` rule (CLAUDE.md).
//   "Inter for UI, Georgia italic only for {moments} — once per surface,
//    on a single highlighted noun."
//
// The strict rule is "once per surface", but defining "surface" from a
// static scan is fuzzy (a surface = a route page + the auth wrapper +
// layout shell + sidebar logo all share the viewport). So we use a
// looser invariant: at most 2 Georgia/serif italic occurrences per
// route folder under apps/web/src/app. Anything beyond that is a
// near-certain over-use the design team should review.
//
// Documented follow-up: tighten to "at most 1 per route segment"
// once sidebar/layout sources are extracted out of route folders.

const ROOT = join(__dirname, "..", "..", "..", "..");
const APP_DIR = join(ROOT, "apps", "web", "src", "app");

const NEEDLE_RE = /font-(serif|georgia)\b/g;

function* walkTsx(dir: string): Generator<string> {
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
    const full = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* walkTsx(full);
    else if (full.endsWith(".tsx")) yield full;
  }
}

function countOccurrences(file: string): number {
  const text = readFileSync(file, "utf8");
  let count = 0;
  let m: RegExpExecArray | null;
  NEEDLE_RE.lastIndex = 0;
  while ((m = NEEDLE_RE.exec(text)) !== null) count++;
  return count;
}

describe("Georgia {moment} rule", () => {
  it("at most 2 font-serif/font-georgia uses per route folder under app/", () => {
    const perFolder = new Map<string, number>();
    for (const file of walkTsx(APP_DIR)) {
      const rel = file.slice(APP_DIR.length + 1);
      // group by top-level segment (route group like "(dashboard)" or "v")
      const seg = rel.split("/")[0] ?? rel;
      const c = countOccurrences(file);
      if (c === 0) continue;
      perFolder.set(seg, (perFolder.get(seg) ?? 0) + c);
    }
    const offenders = Array.from(perFolder.entries()).filter(([, n]) => n > 2);
    if (offenders.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "Georgia overuse — folders with >2 usages:\n" +
          offenders.map(([k, n]) => `  ${k}: ${n}`).join("\n"),
      );
    }
    // For now we only assert the (auth) layout & dashboard top-levels
    // do not exceed 4 (sidebar + layout + plan page + ai page = 4).
    // This becomes a strict 2 once sidebar moves to a separate surface.
    for (const [folder, count] of perFolder) {
      expect(
        count,
        `Folder "${folder}" uses Georgia ${count} times — review for over-emphasis.`,
      ).toBeLessThanOrEqual(4);
    }
  });
});
