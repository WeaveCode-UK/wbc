# DeepSeek — Estratégia de Fallback

> Contexto: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-006`. Hoje, `packages/business/ai/adapters/deepseek-adapter.ts` usa `@wbc/shared/circuit-breaker`, mas quando o breaker abre (ou a API retorna erro), o fallback é uma string estática ou um erro cru — a feature degrada para "não funciona". Isto cria perda de valor percebido durante indisponibilidade do provider e ainda converte cada falha num ticket de suporte. Documento registra a estratégia de cache + fallback controlado que o time deverá implementar.

## Estado atual

- **Adapter:** `packages/business/ai/adapters/deepseek-adapter.ts`
- **Circuit breaker:** abre após N falhas consecutivas; não tem cache.
- **Comportamento ao abrir:** retorna string estática ou lança.
- **Consumidores:** `generateCampaign`, `generatePost`, demais use-cases em `packages/business/ai`.

Gaps:

1. Sem cache de respostas anteriores — mesma campanha, mesma data do mês ⇒ payloads similares poderiam reusar output.
2. Sem fallback a modelo mais barato (ex.: prompt reduzido local, Llama-3 self-hosted) quando o principal cai.
3. Sem "modo offline" explícito no UI — cliente vê erro genérico.

## Estratégia proposta

### Camada 1 — Cache Redis (cheap hit)

Hash da request (prompt + temperature + model) como chave:

```
Key:  ai:deepseek:v1:<sha256(prompt|temperature|model)>
TTL:  24h para prompts de marketing; 7d para prompts determinísticos
Val:  JSON do response
```

Hit rate esperado: 20-30% em produção (templates de campanha mensal, recorrência em consultas tipo).

- Reduz custo diretamente.
- Fallback automático quando API está down (se houver cache hit).

### Camada 2 — Template offline

Quando cache miss + API down, retornar um dos templates curados por categoria:

```
packages/business/ai/templates/offline/
  campaign-dia-das-maes.md
  campaign-promocao-padrao.md
  post-geral.md
  ...
```

Resposta inclui flag `fromOfflineTemplate: true` para UI informar o usuário explicitamente ("gerado via modelo offline — tente novamente mais tarde para conteúdo personalizado").

### Camada 3 — Modelo barato (opcional, futuro)

Se disponibilidade premium for crítica, subir container com Llama-3-8B quantizado localmente. Latência maior, qualidade menor, mas 100% disponível.

```
DeepSeek (primário) → Cache Redis → Offline template → [Llama local]
```

## Implementação — pendente (humano)

### Ordem sugerida

1. **Wrapper no adapter:** `DeepSeekAdapter.generate` consulta cache antes de chamar a API; grava resposta no cache no sucesso.
2. **Coleção inicial de templates:** 5-10 templates cobrindo 80% dos casos.
3. **Flag `fromOfflineTemplate`** propagada até UI para badge informativo.
4. **Métrica Prometheus:** `ai_fallback_used_total{type=cache|offline|model}`.
5. **Smoke test:** matar container da API do DeepSeek e verificar que a UI mostra template offline.

### Riscos

- **Cache envenenado:** se um prompt for adulterado, resposta incorreta persiste 24h. Mitigação: TTL curto + invalidação manual via admin.
- **Template desatualizado:** template offline de "dia das mães" servido em novembro. Mitigação: data-awareness no seletor de template.
- **Custo Redis:** cache é só texto, ~1-2 KB/item; em 10k hits/mês = 10-20 MB, desprezível.

## Unit economics

Com hit rate de 25%:

- 300 gerações/mês × 75% = 225 chamadas reais × US$ 0,00056 = US$ 0,126
- Redução vs. sem cache: US$ 0,042/mês/tenant PRO (~25% de US$ 0,168).
- Em 100 tenants PRO = US$ 4,2/mês de economia.

Não é o principal valor. O ganho real é de **disponibilidade percebida**, não de economia direta.

## Cross-reference

- Achado origem: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-006`
- Kill-switch de emergência: `docs/FEATURE-FLAGS-FOLLOWUP.md#emergency-kill-switches-ach-012-custos-finops` (`KILL_SWITCH.DEEPSEEK`)
- Cost budget: `docs/FINOPS-KILL-SWITCH.md` (a ser criado por ACH-001)
