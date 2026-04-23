/**
 * ACH-008 seed: minimal feature-flag helper that reads flags from a JSON blob
 * in the `FEATURE_FLAGS_JSON` environment variable. Designed so callers can
 * migrate to a real provider (Growthbook/Unleash/LaunchDarkly) later without
 * changing call sites.
 *
 * Usage:
 *   import { flag } from '@wbc/shared/feature-flags';
 *   if (flag('new_sale_flow', false)) { ... }
 *
 * Format of FEATURE_FLAGS_JSON:
 *   {"new_sale_flow": true, "landing_redesign": false}
 *
 * docs/FEATURE-FLAGS-FOLLOWUP.md lists the migration steps.
 */

type FlagValue = boolean | string | number;

let cache: Record<string, FlagValue> | null = null;

function load(): Record<string, FlagValue> {
  if (cache !== null) return cache;
  const raw = process.env.FEATURE_FLAGS_JSON;
  if (!raw) {
    cache = {};
    return cache;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      cache = parsed as Record<string, FlagValue>;
    } else {
      cache = {};
    }
  } catch {
    cache = {};
  }
  return cache;
}

/**
 * Read a feature flag value.
 * Returns `defaultValue` when the flag is unset or FEATURE_FLAGS_JSON
 * is missing/invalid.
 */
export function flag<T extends FlagValue>(name: string, defaultValue: T): T {
  const flags = load();
  const value = flags[name];
  if (value === undefined) return defaultValue;
  if (typeof value !== typeof defaultValue) return defaultValue;
  return value as T;
}

/**
 * Test-only helper to reset the cache. Never call in production code.
 */
export function __resetFlagsForTesting(): void {
  cache = null;
}

/**
 * ACH-012 custos-finops: nomes canônicos de kill-switches de emergência
 * para integrações pagas. Ver docs/FEATURE-FLAGS-FOLLOWUP.md seção
 * "Emergency kill-switches (ACH-012)".
 *
 * Uso:
 *   import { flag, KILL_SWITCH } from '@wbc/shared/feature-flags';
 *
 *   if (!flag(KILL_SWITCH.DEEPSEEK, true)) {
 *     // DeepSeek desabilitado — cair para template offline
 *     return fallbackTemplate();
 *   }
 *
 * Defaults recomendados: `true` (ligado). O operador flipa para `false`
 * em emergência de custo sem redeploy — basta atualizar FEATURE_FLAGS_JSON
 * e reiniciar o container (ou aguardar o cache expirar em provider real).
 */
export const KILL_SWITCH = {
  DEEPSEEK: "kill_switch.deepseek",
  WHATSAPP: "kill_switch.whatsapp",
  SENTRY: "kill_switch.sentry",
  AI_GENERATIONS: "kill_switch.ai_generations",
} as const;

export type KillSwitchName = (typeof KILL_SWITCH)[keyof typeof KILL_SWITCH];
