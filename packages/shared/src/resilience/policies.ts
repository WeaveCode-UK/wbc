// Políticas default por provider, configuráveis via env vars (ACH-008).
// Convenção: <PROVIDER>_<FIELD>_MS, ex: WHATSAPP_TIMEOUT_MS, DEEPSEEK_MAX_RETRIES.

import type { RetryPolicy } from "./retry";
import type { TimeoutPolicy } from "./timeout";

function readEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// WhatsApp — respostas rápidas esperadas; retries curtos.
export const whatsappRetryPolicy: RetryPolicy = {
  maxRetries: readEnvInt("WHATSAPP_MAX_RETRIES", 2),
  baseDelayMs: readEnvInt("WHATSAPP_RETRY_DELAY_MS", 1_000),
};

export const whatsappTimeoutPolicy: TimeoutPolicy = {
  timeoutMs: readEnvInt("WHATSAPP_TIMEOUT_MS", 10_000),
};

// DeepSeek — inferência LLM; tolera mais tempo, delays maiores entre tentativas.
export const deepseekRetryPolicy: RetryPolicy = {
  maxRetries: readEnvInt("DEEPSEEK_MAX_RETRIES", 2),
  baseDelayMs: readEnvInt("DEEPSEEK_RETRY_DELAY_MS", 2_000),
};

export const deepseekTimeoutPolicy: TimeoutPolicy = {
  timeoutMs: readEnvInt("DEEPSEEK_TIMEOUT_MS", 30_000),
};
