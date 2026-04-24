# Progresso da Correção

## Identificação
- dominio: documentacao-runbooks
- run_id: 2026-04-19_21-26-25
- branch: fix/documentacao-runbooks/2026-04-19_21-26-25
- data_inicio: 2026-04-24 07:35:55
- ultima_atualizacao: 2026-04-24 08:45:00
- fase_atual: revisor
- status: revisor_concluido

## Resumo de Progresso
- total_aprovados: 18
- corrigidos_executor: 18
- revisados_revisor: 18
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
- status_revisor: aprovado
- commit_executor: 838d2c9
- commit_revisor: none
- arquivos_alterados:
  - SECURITY.md
- descricao_correcao: estende com seção PGP (.well-known URL + fingerprint), safe-harbor com 5 regras, timeline de disclosure (ack 2d, triagem 5d, fix 30/60d, embargo 90d), out-of-scope
- observacoes: none
- nota_revisao: SECURITY.md agora tem canal dedicado (security@weavecode.co.uk), SLA (ack 2d, triagem 5d, crítico 24h), PGP via .well-known, safe-harbor com 5 regras claras, timeline tabelada, out-of-scope. Recomendação totalmente atendida.

### ACH-002
- titulo: README raiz vazio
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: aae0df2
- commit_revisor: none
- arquivos_alterados:
  - README.md
- descricao_correcao: README completo com stack, quickstart passo-a-passo, tabela de scripts, documentação (arquitetura/operações/governança/auditoria), fluxo de desenvolvimento; inclui badges (ACH-017) e rodapé de revisão (ACH-014 seed)
- observacoes: incluiu ACH-017 no mesmo commit
- nota_revisao: README cobre quickstart (install/dev/build/migrate/seed), stack com versões, tabela de scripts, links para docs/ARCHITECTURE.md, docs/DEPLOYMENT.md, begin/WBC_ORCHESTRATOR.md e demais. Rodapé freshness aplicado. Conteúdo coerente com code atual (pnpm 9.15.4, Node 20.18, Next 15, tRPC 11).

### ACH-003
- titulo: CONTRIBUTING.md guia dev ausente
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md
- descricao_correcao: estende com "Developer guide" cobrindo branching, commits (tabela types+scopes + corpo why), PRs (checklist, template, review rules, merge), arch:check, policy de docs (language/comment/freshness)
- observacoes: commit consolidado ACH-003 + ACH-011 + ACH-014 + ACH-016
- nota_revisao: CONTRIBUTING agora tem Developer guide com branching, Conventional Commits (tabela de types+scopes, exemplos com corpo why, BREAKING CHANGE), PR checklist, template body (Context/Changes/Test plan), review rules (CODEOWNERS, 2 olhos para áreas críticas), merge strategy (squash default, merge commit para correções de auditoria), arch:check. Recomendação completa.

### ACH-004
- titulo: DR sem execução/validação
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 2f1490b
- commit_revisor: none
- arquivos_alterados:
  - docs/runbooks/dr.md
- descricao_correcao: runbook 10 passos (declarar incident → provisionar → clonar → secrets → backup S3 → subir Postgres → restaurar → migrations → stack → smoke test bloqueante → post-mortem)
- observacoes: cabeçalho marca drill real não executado (parcial); RPO/RTO são meta não medida
- nota_revisao: dr.md documenta procedimento passo-a-passo completo (10 etapas) com comandos concretos. Aviso no topo é explícito: RPO/RTO são meta (não medição), drill real ainda não rodou. Parcial por design — o Executor fez o máximo possível em software; drill real requer humano. Recomendação documental atendida; parcialidade foi classificada na origem.

### ACH-005
- titulo: RUNBOOKS incompletos
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 270d198
- commit_revisor: none
- arquivos_alterados:
  - docs/runbooks/dlq-replay.md
  - docs/runbooks/worker-scaling.md
  - docs/runbooks/certbot-ssl-expiring.md
- descricao_correcao: 3 runbooks novos (dlq-replay com SQL batched, worker-scaling horizontal+vertical, certbot renewal forçada+fallback); runbooks existentes (outbox-lag, dlq-growing, queue-depth, target-down) já seguem template
- observacoes: none
- nota_revisao: 3 runbooks novos completos com trigger/diag/mitigação/rollback/post-mortem. dlq-replay inclui SQL em lotes para volumes grandes e validação com ProcessedEvent.idempotencyKey. worker-scaling cobre horizontal+vertical com alerta graceful shutdown 40s (coerente com ACH-005 confiabilidade). certbot cobre renewal forçada, emissão do zero e fallback self-signed. Recomendação atendida plenamente.

### ACH-006
- titulo: ARCHITECTURE sem diagramas de sequência
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f167377
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/flows.md
- descricao_correcao: 3 diagramas Mermaid sequenceDiagram (criar venda, enviar campanha, aceitar convite) com garantias de atomicidade, idempotência, circuit breaker
- observacoes: none
- nota_revisao: 3 diagramas Mermaid sequenceDiagram exatamente como pediu o achado (criar venda, enviar campanha, aceitar invite). Cada um tem ator, hops web/DB/worker/provider, garantias de atomicidade, idempotência (ProcessedEvent.idempotencyKey), throttle, circuit breaker. Acoplado com ADR-003 (outbox) e ADR-007 (resilience). Processo de atualização documentado.

### ACH-007
- titulo: Apps não descritos individualmente
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 0f9c06f
- commit_revisor: none
- arquivos_alterados:
  - docs/ARCHITECTURE.md
- descricao_correcao: nova seção "Apps" com tabela (tecnologia, URL/porta, responsabilidade) e regras de comunicação entre apps
- observacoes: none
- nota_revisao: seção Apps cobre 5 apps (web, api, worker, mobile, landing) com tecnologia, URL/porta, responsabilidade em 3-5 linhas. Regras de comunicação explícitas (proibido worker chamar tRPC do web). Recomendação do achado atendida.

### ACH-008
- titulo: Runbooks sem índice central
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 30d2ba2
- commit_revisor: none
- arquivos_alterados:
  - docs/OPERATIONS.md
- descricao_correcao: índice com tabela alerta→runbook e cenário→runbook, template de criação, pointers para runbooks em outros docs
- observacoes: none
- nota_revisao: OPERATIONS.md atua como ponto de partida em incidente; tabela alerta→runbook mapeia todos os alertas ativos do deploy/alerts.yml + runbooks operacionais (dr, dlq-replay, worker-scaling, certbot); seção "Como ler" + "Criação" + "Runbooks em outros docs" (FinOps, Husky, Auth, Deploy). README raiz agora aponta para este índice. Recomendação plena.

### ACH-009
- titulo: Failover sem gatilhos
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 3fbf9ff
- commit_revisor: none
- arquivos_alterados:
  - docs/DEPLOYMENT.md
- descricao_correcao: seção failover com tabela de 6 gatilhos (tenants, p95 latência, queue depth, Postgres CPU, Redis memory, availability), diagrama ASCII HA target, SLOs alinhados
- observacoes: none
- nota_revisao: tabela de 6 gatilhos com limiar, alvo arquitetural e prazo de decisão (tenants>100, p95>500ms, queue>500, Postgres CPU>60%, Redis >80%, availability <99.5%); diagrama ASCII HA target; SLOs alinhados (99.9%, p95<300ms, RPO 1h, RTO 4h). Recomendação exata do achado.

### ACH-010
- titulo: Sem GLOSSARY
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5e73b0d
- commit_revisor: none
- arquivos_alterados:
  - docs/GLOSSARY.md
- descricao_correcao: 25 termos em ordem alfabética (ABC, ACH, ADR, AsyncLocalStorage, BullMQ, Circuit breaker, CODEOWNERS, Composition root, CostBudgetService, DLQ, Hexagonal, Idempotência, Kill-switch, LGPD, Lockfile integrity, OTB anti-termo, Outbox pattern, PII, RLS, RPO/RTO, Run, SBOM, Tenant, tRPC, Turborepo, WA)
- observacoes: none
- nota_revisao: 26 termos alfabéticos com 2-3 linhas cada + links para ADRs/arquivos (ADR-001, ADR-002, ADR-003, ADR-007, packages/shared/src/*, docs/architecture/*, docs/DATA_RETENTION_POLICY.md etc.). Cobre o range pedido (15-25) e mais. Critério "se aparece 2x, deveria estar aqui" estabelecido.

### ACH-011
- titulo: Comentários ACH-### no código
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md (policy "Code comment policy")
- descricao_correcao: policy em CONTRIBUTING.md: why-first + ACH como footnote; NÃO reformula 100+ comentários existentes (churn > valor)
- observacoes: commit é o mesmo de ACH-003 (consolidado)
- nota_revisao: policy correta: avoid/prefer exemplos, ACH como footnote opcional, regra "não mass-rewrite comentários históricos — substitui quando tocar código por outra razão". Parcial por design como indicado na recomendação (manter ACH em docs internas).

### ACH-012
- titulo: Sem CHANGELOG
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 8932b29
- commit_revisor: none
- arquivos_alterados:
  - CHANGELOG.md
- descricao_correcao: Keep a Changelog pt-BR com seção Unreleased consolidando entregas da campanha; seção "Como manter"
- observacoes: commit consolidado ACH-012 + ACH-015
- nota_revisao: CHANGELOG no formato Keep a Changelog pt-BR com link canônico, seções Added/Changed/Removed/Security em Unreleased, placeholder para 1.0.0, seção "Como manter" e rodapé de freshness. Entregas da campanha consolidadas (supply-chain, custos-finops, documentacao-runbooks).

### ACH-013
- titulo: ADRs proposto sem SLA
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: b544b96
- commit_revisor: none
- arquivos_alterados:
  - docs/adr/006-ai-module-model.md
  - docs/adr/008-worker-scaling.md
- descricao_correcao: cabeçalhos ganham "Decisão esperada até 2026-07-18", "Responsável", "Fallback padrão se prazo expirar"; ADR-008 também pode ser forçado antes se gatilhos de escala dispararem
- observacoes: none
- nota_revisao: ambos ADRs agora têm Decisão esperada até YYYY-MM-DD (2026-07-18), Responsável (Tech Lead Robson + PO/Platform team) e Fallback padrão detalhado (ADR-006: Opção A gateway anêmico; ADR-008: pool global, WORKER_CONCURRENCY=5, scale manual). Recomendação exata do achado.

### ACH-014
- titulo: Sem "última revisão" nem política
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md (seção "Docs freshness policy")
- descricao_correcao: policy + rodapé sample; aplicação nos novos docs criados (README, SECURITY, CONTRIBUTING, CHANGELOG, CODE_OF_CONDUCT, OPERATIONS, GLOSSARY, runbooks, flows, DOCUMENTATION-ROADMAP, FINOPS-*); rolled out gradualmente nos demais
- observacoes: commit é o mesmo de ACH-003 (consolidado); parcial por design (rollout gradual)
- nota_revisao: política "Última revisão: YYYY-MM-DD · Próxima revisão esperada: YYYY-MM-DD" documentada, com regra de cadência (3 meses para ops, 12 para ADRs/policy), ação na edição (atualizar na mesma PR) e roadmap opcional de CI. Parcial por design (rollout gradual declarado). Aceitável.

### ACH-015
- titulo: CODE_OF_CONDUCT ausente
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 8932b29
- commit_revisor: none
- arquivos_alterados:
  - CODE_OF_CONDUCT.md
- descricao_correcao: Contributor Covenant 2.1 pt-BR completo; canal conduct@weavecode.co.uk; 4 níveis de aplicação
- observacoes: commit é o mesmo de ACH-012 (consolidado)
- nota_revisao: CoC é Contributor Covenant 2.1 pt-BR, todas as seções (compromisso, padrões, responsabilidades, escopo, aplicação, 4 níveis de diretrizes de impacto, atribuição ao Contributor Covenant + Mozilla). Canal conduct@weavecode.co.uk declarado. Recomendação atendida.

### ACH-016
- titulo: Tradução não definida
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5c70165
- commit_revisor: none
- arquivos_alterados:
  - CONTRIBUTING.md (seção "Language")
- descricao_correcao: policy: docs/ em inglês, Auditoria/ e begin/ em pt-BR, código/PRs em inglês; traduzir exige ADR
- observacoes: commit é o mesmo de ACH-003
- nota_revisao: policy de idioma claro por área (docs=en, Auditoria+begin=pt-BR, código/PR=en); tradução requer ADR. Recomendação atendida com a decisão explícita que o achado pediu.

### ACH-017
- titulo: README sem badges
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: aae0df2
- commit_revisor: none
- arquivos_alterados:
  - README.md
- descricao_correcao: 3 badges (CI workflow, Docker Images workflow, License proprietary); comment nota que URLs são placeholders até Actions público
- observacoes: commit é o mesmo de ACH-002
- nota_revisao: 3 badges presentes (CI, Docker Images, License) com comentário HTML explicando natureza placeholder. Recomendação do achado (baixa: "quando CI estável adicionar") atendida com nota honesta sobre placeholders.

### ACH-018
- titulo: Cross-ref de docs de outros domínios
- severidade: informativo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: da82ded
- commit_revisor: none
- arquivos_alterados:
  - docs/DOCUMENTATION-ROADMAP.md
- descricao_correcao: backlog consolidado (governança/operações/FinOps/compliance/APIs/observabilidade/arquitetura) com status por doc, origem, priorização 1-8, manutenção trimestral
- observacoes: none
- nota_revisao: roadmap cobre 8 categorias com tabelas de status (completo/parcial/ausente), origem, próximo passo; cita explicitamente os cross-refs do achado (PRIVACY_POLICY, SUB_PROCESSORS, DPIA, INCIDENT_RESPONSE_PRIVACY, COOKIE_POLICY, VERSIONING, FILTERING_AND_SORTING, EVENTS_SCHEMAS, SLO). Priorização 1-8 com rationale; política de revisão trimestral; como manter. Recomendação plenamente atendida.
