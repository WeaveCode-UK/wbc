# Plano de Correção — documentacao-runbooks

## Identificação
- dominio: documentacao-runbooks
- run_id: 2026-04-19_21-26-25
- data_geracao: 2026-04-24 07:35:55
- total_achados: 18
- corrigiveis: 15
- corrigiveis_parciais: 3
- nao_corrigiveis: 0

## Ordem de Execução

### Bloco A — Docs de raiz
1. ACH-002 (alto, corrigivel) — README.md (quickstart, stack, scripts, links, badges)
2. ACH-001 (alto, corrigivel) — estende SECURITY.md (PGP + safe-harbor + disclosure policy)
3. ACH-003 (alto, corrigivel) — estende CONTRIBUTING.md (guia de dev: commits, PRs, branches)
4. ACH-012 (medio, corrigivel) — CHANGELOG.md (Keep a Changelog pt-BR)
5. ACH-015 (baixo, corrigivel) — CODE_OF_CONDUCT.md (Contributor Covenant 2.1)

### Bloco B — Runbooks operacionais
6. ACH-008 (medio, corrigivel) — docs/OPERATIONS.md (índice central)
7. ACH-005 (alto, corrigivel) — 7 runbooks em docs/runbooks/*.md
8. ACH-004 (alto, corrigivel_parcial) — docs/runbooks/dr.md (step-by-step; drill real humano)

### Bloco C — Arquitetura
9. ACH-007 (medio, corrigivel) — ARCHITECTURE.md seção "Apps"
10. ACH-006 (medio, corrigivel) — docs/architecture/flows.md (Mermaid sequence)
11. ACH-009 (medio, corrigivel) — DEPLOYMENT.md failover com gatilhos SLO
12. ACH-010 (medio, corrigivel) — docs/GLOSSARY.md

### Bloco D — Governança
13. ACH-013 (medio, corrigivel) — ADR-006 e ADR-008: decisão esperada + responsável
14. ACH-016 (baixo, corrigivel) — CONTRIBUTING.md: Language policy
15. ACH-014 (medio, corrigivel_parcial) — CONTRIBUTING.md policy + rodapé sample em 3 docs
16. ACH-011 (medio, corrigivel_parcial) — CONTRIBUTING.md: Comentários ACH policy (sem reformular todo código)
17. ACH-017 (baixo, corrigivel) — README badges (placeholders)
18. ACH-018 (informativo, corrigivel) — docs/DOCUMENTATION-ROADMAP.md

## Achados Não Corrigíveis
Nenhum.

## Resumo
- Total a corrigir: 15
- Total parcial: 3
- Total não corrigível: 0
- Estimativa de commits: 20
