# Progresso da Correção

## Identificação
- dominio: documentacao-runbooks
- run_id: 2026-04-19_21-26-25
- branch: fix/documentacao-runbooks/2026-04-19_21-26-25
- data_inicio: 2026-04-24 07:35:55
- ultima_atualizacao: 2026-04-24 08:10:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 18
- corrigidos_executor: 18
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-001
- titulo: SECURITY.md incompleto
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 838d2c9
- commit_revisor: none
- arquivos_alterados:
  - SECURITY.md
- descricao_correcao: estende com seção PGP (.well-known URL + fingerprint), safe-harbor com 5 regras, timeline de disclosure (ack 2d, triagem 5d, fix 30/60d, embargo 90d), out-of-scope
- observacoes: none

### ACH-002
- titulo: README raiz vazio
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: aae0df2
- commit_revisor: none
- arquivos_alterados:
  - README.md
- descricao_correcao: README completo com stack, quickstart passo-a-passo, tabela de scripts, documentação (arquitetura/operações/governança/auditoria), fluxo de desenvolvimento; inclui badges (ACH-017) e rodapé de revisão (ACH-014 seed)
- observacoes: incluiu ACH-017 no mesmo commit

### ACH-003
- titulo: CONTRIBUTING.md guia dev ausente
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md
- descricao_correcao: estende com "Developer guide" cobrindo branching, commits (tabela types+scopes + corpo why), PRs (checklist, template, review rules, merge), arch:check, policy de docs (language/comment/freshness)
- observacoes: commit consolidado ACH-003 + ACH-011 + ACH-014 + ACH-016

### ACH-004
- titulo: DR sem execução/validação
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 2f1490b
- commit_revisor: none
- arquivos_alterados:
  - docs/runbooks/dr.md
- descricao_correcao: runbook 10 passos (declarar incident → provisionar → clonar → secrets → backup S3 → subir Postgres → restaurar → migrations → stack → smoke test bloqueante → post-mortem)
- observacoes: cabeçalho marca drill real não executado (parcial); RPO/RTO são meta não medida

### ACH-005
- titulo: RUNBOOKS incompletos
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 270d198
- commit_revisor: none
- arquivos_alterados:
  - docs/runbooks/dlq-replay.md
  - docs/runbooks/worker-scaling.md
  - docs/runbooks/certbot-ssl-expiring.md
- descricao_correcao: 3 runbooks novos (dlq-replay com SQL batched, worker-scaling horizontal+vertical, certbot renewal forçada+fallback); runbooks existentes (outbox-lag, dlq-growing, queue-depth, target-down) já seguem template
- observacoes: none

### ACH-006
- titulo: ARCHITECTURE sem diagramas de sequência
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f167377
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/flows.md
- descricao_correcao: 3 diagramas Mermaid sequenceDiagram (criar venda, enviar campanha, aceitar convite) com garantias de atomicidade, idempotência, circuit breaker
- observacoes: none

### ACH-007
- titulo: Apps não descritos individualmente
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 0f9c06f
- commit_revisor: none
- arquivos_alterados:
  - docs/ARCHITECTURE.md
- descricao_correcao: nova seção "Apps" com tabela (tecnologia, URL/porta, responsabilidade) e regras de comunicação entre apps
- observacoes: none

### ACH-008
- titulo: Runbooks sem índice central
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 30d2ba2
- commit_revisor: none
- arquivos_alterados:
  - docs/OPERATIONS.md
- descricao_correcao: índice com tabela alerta→runbook e cenário→runbook, template de criação, pointers para runbooks em outros docs
- observacoes: none

### ACH-009
- titulo: Failover sem gatilhos
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3fbf9ff
- commit_revisor: none
- arquivos_alterados:
  - docs/DEPLOYMENT.md
- descricao_correcao: seção failover com tabela de 6 gatilhos (tenants, p95 latência, queue depth, Postgres CPU, Redis memory, availability), diagrama ASCII HA target, SLOs alinhados
- observacoes: none

### ACH-010
- titulo: Sem GLOSSARY
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5e73b0d
- commit_revisor: none
- arquivos_alterados:
  - docs/GLOSSARY.md
- descricao_correcao: 25 termos em ordem alfabética (ABC, ACH, ADR, AsyncLocalStorage, BullMQ, Circuit breaker, CODEOWNERS, Composition root, CostBudgetService, DLQ, Hexagonal, Idempotência, Kill-switch, LGPD, Lockfile integrity, OTB anti-termo, Outbox pattern, PII, RLS, RPO/RTO, Run, SBOM, Tenant, tRPC, Turborepo, WA)
- observacoes: none

### ACH-011
- titulo: Comentários ACH-### no código
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md (policy "Code comment policy")
- descricao_correcao: policy em CONTRIBUTING.md: why-first + ACH como footnote; NÃO reformula 100+ comentários existentes (churn > valor)
- observacoes: commit é o mesmo de ACH-003 (consolidado)

### ACH-012
- titulo: Sem CHANGELOG
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 8932b29
- commit_revisor: none
- arquivos_alterados:
  - CHANGELOG.md
- descricao_correcao: Keep a Changelog pt-BR com seção Unreleased consolidando entregas da campanha; seção "Como manter"
- observacoes: commit consolidado ACH-012 + ACH-015

### ACH-013
- titulo: ADRs proposto sem SLA
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b544b96
- commit_revisor: none
- arquivos_alterados:
  - docs/adr/006-ai-module-model.md
  - docs/adr/008-worker-scaling.md
- descricao_correcao: cabeçalhos ganham "Decisão esperada até 2026-07-18", "Responsável", "Fallback padrão se prazo expirar"; ADR-008 também pode ser forçado antes se gatilhos de escala dispararem
- observacoes: none

### ACH-014
- titulo: Sem "última revisão" nem política
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md (seção "Docs freshness policy")
- descricao_correcao: policy + rodapé sample; aplicação nos novos docs criados (README, SECURITY, CONTRIBUTING, CHANGELOG, CODE_OF_CONDUCT, OPERATIONS, GLOSSARY, runbooks, flows, DOCUMENTATION-ROADMAP, FINOPS-*); rolled out gradualmente nos demais
- observacoes: commit é o mesmo de ACH-003 (consolidado); parcial por design (rollout gradual)

### ACH-015
- titulo: CODE_OF_CONDUCT ausente
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 8932b29
- commit_revisor: none
- arquivos_alterados:
  - CODE_OF_CONDUCT.md
- descricao_correcao: Contributor Covenant 2.1 pt-BR completo; canal conduct@weavecode.co.uk; 4 níveis de aplicação
- observacoes: commit é o mesmo de ACH-012 (consolidado)

### ACH-016
- titulo: Tradução não definida
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md (seção "Language")
- descricao_correcao: policy: docs/ em inglês, Auditoria/ e begin/ em pt-BR, código/PRs em inglês; traduzir exige ADR
- observacoes: commit é o mesmo de ACH-003

### ACH-017
- titulo: README sem badges
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: aae0df2
- commit_revisor: none
- arquivos_alterados:
  - README.md
- descricao_correcao: 3 badges (CI workflow, Docker Images workflow, License proprietary); comment nota que URLs são placeholders até Actions público
- observacoes: commit é o mesmo de ACH-002

### ACH-018
- titulo: Cross-ref de docs de outros domínios
- severidade: informativo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: da82ded
- commit_revisor: none
- arquivos_alterados:
  - docs/DOCUMENTATION-ROADMAP.md
- descricao_correcao: backlog consolidado (governança/operações/FinOps/compliance/APIs/observabilidade/arquitetura) com status por doc, origem, priorização 1-8, manutenção trimestral
- observacoes: none
