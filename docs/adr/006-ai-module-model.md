# ADR-006: Modelo de domínio do módulo `ai/`

- **Status:** proposto (aguardando decisão humana sobre Opção A vs Opção B)
- **Data:** 2026-04-18
- **Contexto:** ACH-006 da auditoria de arquitetura (run `2026-04-18_18-17-50`).

## Contexto

O monorepo contém 16 módulos em `packages/business/*`. Quinze deles seguem a estrutura hexagonal canônica (`domain/`, `ports/`, `adapters/`, `use-cases/`). O módulo `ai/` diverge: não possui pasta `domain/`. Use-cases de geração de texto são procedurais — chamam `AIProvider` e `AIRepository` via ports, sem encapsular regras de domínio em entidades ou value-objects.

A auditoria registrou o gap como ACH-006 (severidade média, classificação `corrigivel_parcial`).

## Decisão (a ser tomada)

Duas opções compatíveis com o ADR-001 (hexagonal). A escolha depende de como o módulo `ai/` vai evoluir.

### Opção A — `ai/` permanece anêmico (gateway para provider externo)

O módulo é apenas uma fachada sobre o provider (DeepSeek hoje, outros no futuro). Não há regra de negócio rica; toda lógica interessante está no provider externo. Neste caso:

- Não há `domain/` dedicado. Os tipos `AIGenerateResult` vivem em `ports/`.
- Use-cases permanecem procedurais: recebem prompt, chamam provider via port, retornam texto.
- Convenção documentada: "gateways puros para providers externos podem omitir `domain/`".

**Vantagens:** simplicidade; reflete a realidade atual; menos arquivos a manter.
**Desvantagens:** qualquer regra futura (quotas, rate limit por tenant, seleção de modelo, moderação) precisa ser retroativamente deslocada; convenção abre exceção ao padrão hexagonal uniforme.

### Opção B — `ai/` evolui para hexagonal completo

Cria-se `domain/` com entidades e value-objects genuínos:

- `AIModel`, `AIUsage`, `AILimit` (entidades).
- `totalTokensInWindow()`, `isWithinLimit()` (regras puras).
- `AILimitExceededError`, `AIProviderUnavailableError` (erros tipados).
- Use-cases passam a orquestrar: ler limite, computar consumo, decidir se chamam o provider, persistir uso.

**Vantagens:** uniformidade com os outros 15 módulos; regras testáveis sem integração; rota clara para futuras features (cobrança por tokens, quotas por plano, moderação).
**Desvantagens:** mais arquivos agora; regras ainda não estão implementadas (skeleton só).

## Estado atual deste ADR

O ACH-006 introduziu o skeleton da Opção B em `packages/business/ai/domain/` (entities.ts, value-objects.ts, errors.ts) para permitir adoção gradual. O código atual de `ai/` não depende desse skeleton ainda — ele está disponível mas não é referenciado pelos use-cases ou adapters.

## Decisão pendente

Escolher A ou B e atualizar este ADR com:

- Status final (`aceito` ou `rejeitado`).
- Se A: remover o skeleton de `domain/` e documentar a convenção de exceção.
- Se B: priorizar evolução dos use-cases para orquestrar regras via `domain/` (ver roadmap).

## Consequências

### Se A:

- `domain/` criado pelo ACH-006 deve ser removido.
- Documentar a exceção em `docs/ARCHITECTURE.md` (quando criado — ACH-001).
- `dependency-cruiser` não precisa regra específica para ai/.

### Se B:

- Implementar regra de quota/limit nos use-cases (feature a priorizar).
- Adicionar persistência de `AIUsage` em `adapters/` (Prisma) via novo port `AIUsageRepository`.
- Migrar todos os caminhos de geração para passar por `domain/` (checar limite → gerar → persistir uso).

## Links

- ACH-006 — `/Auditoria/arquitetura/runs/2026-04-18_18-17-50/achados.md`
- ADR-001 — hexagonal architecture
- Skeleton — `packages/business/ai/domain/`
