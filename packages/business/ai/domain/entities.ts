// Entidades de domínio do módulo ai/ — skeleton criado pelo ACH-006.
// A decisão canônica sobre se `ai/` permanece anêmico ou evolui está em
// docs/adr/006-ai-module-model.md. Este arquivo fornece o ponto de partida
// caso a evolução seja aprovada.

/** Modelo de IA identificado por nome canônico e provider. */
export interface AIModel {
  /** Nome do modelo no provider, ex: 'deepseek-chat'. */
  name: string;
  /** Provider host, ex: 'deepseek', 'openai'. */
  provider: string;
}

/** Registro de uma geração: input/output tokens e modelo usado. */
export interface AIUsage {
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
}

/** Política de limite aplicável a um tenant/feature. */
export interface AILimit {
  /** Limite máximo de tokens consumidos no período. */
  maxTokensPerPeriod: number;
  /** Período da janela em segundos (ex: 86400 para diário). */
  periodSeconds: number;
}
