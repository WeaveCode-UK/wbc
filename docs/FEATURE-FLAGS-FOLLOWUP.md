# Feature Flags — Follow-up (ACH-008)

## Estado atual (pós-seed)

`packages/shared/src/feature-flags.ts` expõe `flag(name, defaultValue)` que
lê um JSON de `FEATURE_FLAGS_JSON`. Tem cache por processo (só recarrega se
o processo reiniciar), é type-safe (boolean/string/number), e silencioso
quando a env var está ausente ou inválida.

Exemplo de uso:

```ts
import { flag } from "@wbc/shared";

if (flag("new_sale_flow", false)) {
  // novo fluxo
} else {
  // fluxo legado
}
```

Exemplo de env:

```bash
FEATURE_FLAGS_JSON='{"new_sale_flow": true, "landing_redesign": false}'
```

## Pendências para validação humana

### Curto prazo

1. **Documentar no README** do repo a existência do helper e da env var.
2. **Cache por usuário/tenant**: o helper atual retorna o mesmo valor para
   todo mundo. Quando precisar rollout gradual (10% dos usuários),
   migrar para provider externo.

### Migração para provider real

Quando um rollout gradual ou kill-switch por tenant for necessário:

| Provider     | Prós                                                          | Contras                     |
| ------------ | ------------------------------------------------------------- | --------------------------- |
| Growthbook   | Open-source self-hosted; UI própria; experimentos A/B nativos | mais um serviço para operar |
| Unleash      | Open-source self-hosted; bom SDK JS                           | idem                        |
| LaunchDarkly | SaaS, maduro                                                  | custo, vendor lock-in       |
| Flagsmith    | Meio-termo (SaaS/self-hosted)                                 | SDK JS menos polido         |

**Recomendado:** Growthbook self-hosted, containerizado via Docker Compose
(encaixa com stack atual).

### Contrato de migração

Mantendo a mesma assinatura `flag(name, defaultValue)`, substituir a
implementação por uma que:

1. Inicializa client do provider no startup.
2. Usa contexto (tenantId, userId) quando disponível.
3. Fallback para `defaultValue` se o provider estiver offline.

### Testes

- Unit: cobrir parse robusto (JSON inválido, chaves ausentes, tipos errados).
- Integration: rodar com/sem `FEATURE_FLAGS_JSON` e verificar que
  defaults são respeitados.

## Critério de fechamento

- (1) provider escolhido e operando.
- (2) pelo menos um flag em prod com rollout gradual documentado.
- (3) kill-switch testado em staging.
- (4) README atualizado.

## Emergency kill-switches (ACH-012 custos-finops)

O objetivo aqui é reagir rápido a spikes de custo de integrações pagas
sem precisar redeploy. Os nomes canônicos estão em
`packages/shared/src/feature-flags.ts` (`KILL_SWITCH.*`).

| Constante                    | Flag name                    | Efeito ao virar `false`                                           |
| ---------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| `KILL_SWITCH.DEEPSEEK`       | `kill_switch.deepseek`       | Adapter DeepSeek retorna fallback (cache/template); não chama API |
| `KILL_SWITCH.WHATSAPP`       | `kill_switch.whatsapp`       | Adapter WhatsApp enfileira mas não envia; logs o volume represado |
| `KILL_SWITCH.SENTRY`         | `kill_switch.sentry`         | `beforeSend` retorna null para todos os eventos                   |
| `KILL_SWITCH.AI_GENERATIONS` | `kill_switch.ai_generations` | Bloqueia a operação de `POST /ai/generate` a nível de rota        |

### Uso esperado nos call sites (pendente)

Cada adapter deve consultar sua flag no início do método público:

```ts
// packages/business/ai/adapters/deepseek-adapter.ts (exemplo)
import { flag, KILL_SWITCH } from "@wbc/shared";

async generate(prompt: string) {
  if (!flag(KILL_SWITCH.DEEPSEEK, true)) {
    return { text: OFFLINE_TEMPLATE, fromKillSwitch: true };
  }
  // ... chamada real à API
}
```

Esta integração em cada adapter **fica como trabalho pendente** —
ACH-012 custos-finops entrega apenas as constantes + doc.

### Procedimento de emergência (runbook)

Quando detectar spike de custo (via `docs/FINOPS-OBSERVABILITY.md`):

1. SSH na VPS de produção.
2. Editar `.env.production` atualizando `FEATURE_FLAGS_JSON`:
   ```json
   { "kill_switch.deepseek": false }
   ```
3. Reiniciar container afetado: `docker compose restart web api worker`.
4. Confirmar que métricas de custo param de subir.
5. Abrir incidente em `docs/incidents/YYYY-MM-DD-cost-spike.md`.
6. Investigar causa; religar flag quando resolvido.

### Migração para provider real (reuso)

Quando migrar para Growthbook/Unleash (ver seção acima), as constantes
`KILL_SWITCH.*` seguem como nomes de flag no provider — apenas a
implementação de `flag()` muda. Call sites não mudam.
