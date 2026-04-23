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
