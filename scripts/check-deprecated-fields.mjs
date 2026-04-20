#!/usr/bin/env node
// ACH-005 apis-integracoes: diff the exported validator schemas against
// a snapshot (stored at `.api-snapshot.json`) to surface fields that
// disappeared between releases without a deprecation notice.
//
// Usage:
//   node scripts/check-deprecated-fields.mjs          # exit 1 on breaking diff
//   node scripts/check-deprecated-fields.mjs --snapshot  # rewrite snapshot
//
// This is a stub — the full tree-walk is future work. For now it:
//   1. Loads `packages/validators/src/index.ts` via tsx.
//   2. Enumerates exported schemas and records their top-level field
//      names plus any optional markers.
//   3. Diffs that against `.api-snapshot.json` (created on first run).
//   4. Reports added / removed / newly-required fields.
//
// The snapshot lives in the repo so reviewers see the diff alongside
// the code change that caused it. Commit it as part of intentional
// API bumps; CI fails when the snapshot is stale and the bump PR is
// missing it.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const snapshotPath = resolve(repoRoot, ".api-snapshot.json");
const rewrite = process.argv.includes("--snapshot");

async function loadValidators() {
  // Lazy import so this script can be invoked from CI (where `@wbc/*`
  // aliases are available) without compiling first.
  const mod = await import(
    resolve(repoRoot, "packages/validators/src/index.ts")
  );
  return mod;
}

function describeSchema(schema) {
  if (!schema || typeof schema !== "object") return null;
  const def = schema._def;
  if (!def) return null;
  if (def.typeName !== "ZodObject") return { kind: def.typeName };
  const shape = def.shape();
  const fields = {};
  for (const [name, sub] of Object.entries(shape)) {
    fields[name] = {
      optional: sub.isOptional?.() ?? false,
      nullable: sub.isNullable?.() ?? false,
    };
  }
  return { kind: "ZodObject", fields };
}

function diff(prev, next) {
  const removed = [];
  const added = [];
  const tightened = [];

  for (const [schemaName, prevDesc] of Object.entries(prev)) {
    const nextDesc = next[schemaName];
    if (!nextDesc) {
      removed.push({ schema: schemaName, reason: "schema removed" });
      continue;
    }
    if (prevDesc.kind !== "ZodObject" || nextDesc.kind !== "ZodObject") continue;
    for (const [field, prevField] of Object.entries(prevDesc.fields ?? {})) {
      const nextField = nextDesc.fields?.[field];
      if (!nextField) {
        removed.push({ schema: schemaName, field, reason: "field removed" });
        continue;
      }
      if (prevField.optional && !nextField.optional) {
        tightened.push({
          schema: schemaName,
          field,
          reason: "optional → required",
        });
      }
    }
    for (const [field] of Object.entries(nextDesc.fields ?? {})) {
      if (!prevDesc.fields?.[field]) {
        added.push({ schema: schemaName, field });
      }
    }
  }
  return { removed, added, tightened };
}

async function main() {
  const validators = await loadValidators();
  const snapshot = {};
  for (const [name, value] of Object.entries(validators)) {
    const desc = describeSchema(value);
    if (desc) snapshot[name] = desc;
  }

  if (rewrite || !existsSync(snapshotPath)) {
    writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + "\n");
    console.log("wrote", snapshotPath);
    return;
  }

  const prev = JSON.parse(readFileSync(snapshotPath, "utf8"));
  const { removed, added, tightened } = diff(prev, snapshot);

  if (added.length) {
    console.log("added (OK — MINOR bump):");
    for (const a of added) console.log(`  + ${a.schema}.${a.field}`);
  }
  if (tightened.length) {
    console.log("tightened (MAJOR — needs deprecation path):");
    for (const t of tightened)
      console.log(`  ! ${t.schema}.${t.field}: ${t.reason}`);
  }
  if (removed.length) {
    console.log("removed (MAJOR — must be deprecated first):");
    for (const r of removed)
      console.log(`  - ${r.schema}${r.field ? "." + r.field : ""}: ${r.reason}`);
  }

  if (removed.length || tightened.length) {
    console.error("Breaking change detected. See ACH-005 deprecation policy.");
    process.exit(1);
  }
  if (added.length === 0) {
    console.log("no change");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
