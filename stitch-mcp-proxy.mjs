#!/usr/bin/env node
/**
 * Stitch MCP Proxy — bug workaround wrapper
 *
 * @_davideast/stitch-mcp v0.5.1 has a bug: the "proxy" command calls
 * process.exit(0) right after starting the stdio transport, killing
 * the process before it can handle any MCP JSON-RPC messages.
 *
 * This wrapper patches the file in the npx cache and then spawns
 * the proxy normally. Once the upstream package is fixed, revert
 * .mcp.json back to the original npx command.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';

const NPX = process.env.NPX_PATH || resolve(process.execPath, '../npx');

function findStitchPkg() {
  const base = resolve(homedir(), '.npm/_npx');
  if (!existsSync(base)) return null;
  for (const d of readdirSync(base)) {
    const p = resolve(base, d, 'node_modules/@_davideast/stitch-mcp/dist/commands/proxy/command.js');
    if (existsSync(p)) return p;
  }
  return null;
}

function patch(filePath) {
  const src = readFileSync(filePath, 'utf8');
  if (src.includes('/* PATCHED */')) return;
  const fixed = src.replace(
    /process\.exit\(0\);(\s*}\s*catch)/,
    '/* PATCHED */$1'
  );
  if (fixed !== src) writeFileSync(filePath, fixed);
}

// Patch if already cached
const cached = findStitchPkg();
if (cached) patch(cached);

// Spawn the real proxy
const child = spawn(NPX, ['-y', '@_davideast/stitch-mcp', 'proxy'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 1));
