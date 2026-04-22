// ACH-015 confiabilidade-resiliencia: deadline propagation.
//
// Motivação: hoje cada adapter tem timeout próprio (ex: 3x10s para
// WhatsApp). Quando um handler encadeia múltiplas dependências, o
// somatório pode exceder o SLA operacional sem ninguém perceber.
//
// `withDeadline(budgetMs, fn)` cria um AbortSignal compartilhado;
// qualquer operação descendente que respeite o signal aborta quando
// o orçamento é estourado. Adapters devem aceitar `options.signal`
// em chamadas HTTP.
//
// Follow-up (docs/RELIABILITY-FOLLOWUP.md): propagar via
// AsyncLocalStorage para que o orçamento do request de origem seja
// herdado automaticamente por adapters encadeados sem passagem
// explícita.

export interface DeadlineContext {
  signal: AbortSignal;
  deadlineMs: number;
  remainingMs: () => number;
}

export async function withDeadline<T>(
  budgetMs: number,
  fn: (ctx: DeadlineContext) => Promise<T>,
): Promise<T> {
  const deadlineMs = Date.now() + budgetMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  if (typeof (timer as { unref?: () => void }).unref === "function") {
    (timer as { unref: () => void }).unref();
  }

  const ctx: DeadlineContext = {
    signal: controller.signal,
    deadlineMs,
    remainingMs: () => Math.max(0, deadlineMs - Date.now()),
  };

  try {
    return await fn(ctx);
  } finally {
    clearTimeout(timer);
  }
}

export class DeadlineExceededError extends Error {
  constructor(budgetMs: number) {
    super(`Deadline exceeded after ${budgetMs}ms`);
    this.name = "DeadlineExceededError";
  }
}
