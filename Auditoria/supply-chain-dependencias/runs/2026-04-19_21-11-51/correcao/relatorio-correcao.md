# Relatório de Correção

## Identificação
- dominio: supply-chain-dependencias
- run_id: 2026-04-19_21-11-51
- branch: fix/supply-chain-dependencias/2026-04-19_21-11-51
- data_inicio: 2026-04-23 22:40:54
- data_conclusao: 2026-04-23 23:06:55
- ultima_atualizacao: 2026-04-23 23:06:55
- status: concluido

## Resumo Executivo
Todos os 16 achados da run foram processados. 14 receberam correção técnica completa (overrides de CVE, pins de digest, jobs de CI, política de licenças, Dependabot ampliado, lockfile integrity, cosign keyless + SLSA provenance + SBOM attestation). 2 foram classificados como `corrigivel_parcial` (ACH-002 next-auth beta, ACH-012 next-intl) e receberam documentação com checklist de migração — a ação final depende de decisão humana. O Revisor aprovou os 16 sem precisar fazer `review-fix` (zero discrepâncias). Type-check e build da branch passam sem erros.

## Estatísticas
- total_achados_na_run: 16
- aprovados_para_correcao: 16
- corrigidos_pelo_executor: 16
- aprovados_pelo_revisor_sem_alteracao: 16
- corrigidos_pelo_revisor: 0
- falha_executor_resolvida_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- falha_total (executor + revisor falharam): 0
- taxa_de_acerto_do_executor: 100% (16/16)

## Validação Técnica
- type_check: passou
- build: passou
- tentativas_de_correcao_build: 0
- bloqueio_build: nao
- erro_persistente: nao

## Achados Corrigidos (Executor acertou de primeira)
| ID | Severidade | Título |
|----|-----------|--------|
| ACH-001 | critico | Override protobufjs ≥ 7.5.5 (RCE) |
| ACH-003 | alto | Job security-audit (pnpm audit) em CI |
| ACH-004 | alto | Pin Docker images por digest (7 serviços + 2 Dockerfiles) |
| ACH-005 | alto | cosign keyless + SLSA provenance + SBOM attestation |
| ACH-006 | alto | Dependabot docker + docker-compose + github-actions + grupo major |
| ACH-007 | medio | docs/LICENSING.md + job license-scan |
| ACH-008 | medio | docs/OVERRIDES.md (rationale por override) |
| ACH-009 | medio | Lockfile integrity (sha256 + job CI) |
| ACH-010 | medio | Override picomatch ≥ 4.0.3 |
| ACH-011 | medio | Override vite ^8.0.10 (path traversal) |
| ACH-013 | baixo | Remove @types/bcryptjs e @types/ioredis redundantes |
| ACH-014 | baixo | Pin Node 20.18.1 em .nvmrc e jobs CI fixos |
| ACH-015 | baixo | docs/SECURITY-HUSKY.md + CODEOWNERS cobre /.husky/ |
| ACH-016 | baixo | Job peer-deps-report (strict, non-blocking) |

## Achados Corrigidos com Intervenção do Revisor
Nenhum. O Revisor aprovou todos os 16 sem precisar commitar `review-fix`.

## Achados Parciais (requerem validação humana)

### ACH-002 — next-auth em versão beta (5.0.0-beta.30)
- **O que foi feito:** criado `docs/AUTH-NEXTAUTH-BETA.md` com checklist de bump, ownership e monitoramento. CODEOWNERS já cobria auth paths (`packages/business/auth/`, `apps/web/src/lib/auth.config.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/app/(auth)/`).
- **O que falta:** decidir se aguarda GA de next-auth 5 ou rollback para 4.x LTS; executar o bump escolhido com smoke-test dos fluxos de auth.
- **Por que parcial:** ambas as opções são breaking em produção e exigem testes manuais que um agente não pode executar.

### ACH-012 — next-intl open redirect (CVE pré-4.9.1)
- **O que foi feito:** criado `docs/migrations/next-intl-v4.md` com checklist de migração 3.x → 4.x. Confirmado (grep em `apps/web/src`) que o projeto **não usa** `createMiddleware` de locale-redirect, portanto a CVE não está ativa neste repositório no estado atual.
- **O que falta:** quando for feita qualquer mudança que introduza o middleware, executar a migração para 4.9.1+.
- **Por que parcial:** migração 3→4 tem breaking changes em `getRequestConfig`, providers e layout root — exige refatoração que um agente não pode validar sem testar fluxos de tradução manualmente.

## Achados Não Corrigíveis
Nenhum.

## Achados Não Aprovados pelo Usuário
Nenhum.

## Achados com Falha Total
Nenhum.

## Commits Gerados

| # | Hash | Tipo | Escopo |
|---|------|------|--------|
| 0 | 7829151 | chore | inicializar correção |
| 1 | 6257ff7 | fix | ACH-001 protobufjs |
| 2 | 76f5194 | fix | ACH-010 picomatch |
| 3 | f890f95 | fix | ACH-011 vite |
| 4 | 10e4e07 | fix | ACH-012 next-intl migração doc (parcial) |
| 5 | 7bf6c9e | fix | ACH-013 @types stubs redundantes |
| 6 | 115b156 | fix | ACH-008 docs/OVERRIDES.md |
| 7 | e2fa60e | fix | ACH-002 AUTH-NEXTAUTH-BETA.md (parcial) |
| 8 | 64533b3 | fix | ACH-015 SECURITY-HUSKY + CODEOWNERS |
| 9 | ae1243a | fix | ACH-004 Docker digests |
| 10 | b1bae9e | fix | ACH-014 Node 20.18.1 pin |
| 11 | be3dfb1 | fix | ACH-006 Dependabot expandido |
| 12 | c19be02 | fix | ACH-007 LICENSING + license-scan CI |
| 13 | 6ad7611 | fix | ACH-003 pnpm audit CI |
| 14 | d06994e | fix | ACH-005 cosign + SLSA + SBOM attestation |
| 15 | 4d3fbf9 | fix | ACH-009 lockfile integrity |
| 16 | 52071f3 | fix | ACH-016 peer-deps-report CI |
| 17 | 3793047 | chore | transição executor → revisor |
| 18 | 08f2824 | chore | revisor aprovou 16 achados |

Total: 19 commits (1 init + 16 fixes + 2 transições/revisor).

## Merge
- status_merge: concluido
- branch_origem: fix/supply-chain-dependencias/2026-04-19_21-11-51
- branch_destino: main
- aprovado_por_usuario: sim
- data_merge: 2026-04-23 23:08:00
