# Achados da Auditoria

## Identificação
- dominio: documentacao-runbooks
- run_id: 2026-04-19_21-26-25
- ultima_atualizacao: 2026-04-19 21:45:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Positivos (contexto)
- `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/architecture/events.md` presentes e razoavelmente completos
- 8 ADRs em `docs/adr/` (001 a 008)
- `deploy/RUNBOOKS.md` cobre operações básicas
- `begin/WBC_ORCHESTRATOR.md`, `WBC_REGRAS_INVIOLAVEIS.md`, `WBC_FASES_E_EPICOS.md` bem desenvolvidos para orchestration autônoma

## Achados Registrados

### ACH-001
- titulo: `SECURITY.md` inexistente — sem procedimento de divulgação de vulnerabilidades
- severidade: alto
- categoria: documentacao-de-seguranca
- status: confirmado
- resumo: WBC processa PII e dados sensíveis (cross-ref compliance-privacidade), mas não há canal documentado para pesquisadores reportarem vulnerabilidades (SLA, email dedicado, PGP key, safe-harbor).

#### Evidencia
- arquivo_ou_area: raiz (sem SECURITY.md)

#### Impacto
- tecnico: Vulnerabilidades potencialmente divulgadas publicamente
- negocio: Risco legal e reputacional

#### Recomendacao
- acao_sugerida: `SECURITY.md` com `security@weavecode.co.uk`, SLA 24-48h, PGP opcional, cláusula de boa-fé e disclosure policy
- prioridade: alta

---

### ACH-002
- titulo: README raiz vazio — dev novo não consegue iniciar
- severidade: alto
- categoria: onboarding
- status: confirmado
- resumo: README atual tem apenas título. Sem quickstart (install, dev, build), sem requisitos, sem links para docs, sem badges.

#### Evidencia
- arquivo_ou_area: README.md

#### Impacto
- tecnico: Barreira de entrada para colaboradores
- negocio: Onboarding depende de comunicação individual

#### Recomendacao
- acao_sugerida: README com quickstart, stack, scripts úteis, links (docs/ARCHITECTURE.md, docs/DEPLOYMENT.md, begin/WBC_ORCHESTRATOR.md), badges CI/coverage
- prioridade: alta

---

### ACH-003
- titulo: `CONTRIBUTING.md` inexistente
- severidade: alto
- categoria: governanca-de-contribuicao
- status: confirmado
- resumo: CLAUDE.md menciona Conventional Commits em inglês, mas não há guia formal de PR, branch naming, templates. Sem gate documentado.

#### Evidencia
- arquivo_ou_area: raiz

#### Impacto
- tecnico: Inconsistência de commits e PRs
- negocio: Dificuldade em revisar/automatizar

#### Recomendacao
- acao_sugerida: `CONTRIBUTING.md` com commit template, PR checklist, branch naming, política de testes e link para CODE_OF_CONDUCT (cross-ref testes-qualidade/ACH-007)
- prioridade: alta

---

### ACH-004
- titulo: DR do `docs/DEPLOYMENT.md` é placeholder, sem execução nem validação
- severidade: alto
- categoria: runbook-critico
- status: confirmado
- resumo: Seção "Disaster Recovery" marca RTO/RPO como "pendente validação humana"; `restore.sh` existe mas não há drill documentado (cross-ref dados-persistencia/ACH-018, infra/ACH-004).

#### Evidencia
- arquivo_ou_area: docs/DEPLOYMENT.md (seção DR); deploy/backup/restore.sh

#### Impacto
- tecnico: Recuperação real pode falhar/exceder SLA
- negocio: Perda de dados não mensurada

#### Recomendacao
- acao_sugerida: Executar drill, medir tempos, formalizar runbook passo-a-passo em `docs/runbooks/dr.md`; validar RPO ≤ 1h, RTO ≤ 4h com stakeholders
- prioridade: alta

---

### ACH-005
- titulo: `deploy/RUNBOOKS.md` não cobre DLQ / outbox lag / worker scaling
- severidade: alto
- categoria: runbooks-operacionais
- status: confirmado
- resumo: ADR-007 introduz DLQ, graceful shutdown e lag thresholds, mas o RUNBOOKS não tem casos para "outboxLagMs > 60s", "DLQ crescendo", "replay de evento", "escalar worker". Cross-ref observabilidade/ACH-004 e confiabilidade/ACH-006.

#### Evidencia
- arquivo_ou_area: deploy/RUNBOOKS.md

#### Impacto
- tecnico: Operador trava em incidentes novos
- negocio: MTTR alto

#### Recomendacao
- acao_sugerida: Acrescentar casos em `docs/runbooks/outbox-lag.md`, `dlq-replay.md`, `worker-scaling.md`, `certbot-ssl-expiring.md`; cada um com trigger, diagnóstico, mitigação, rollback
- prioridade: alta

---

### ACH-006
- titulo: `docs/ARCHITECTURE.md` sem diagramas de sequência de fluxos críticos
- severidade: medio
- categoria: arquitetura
- status: confirmado
- resumo: Estrutura de módulos e eventos existe, mas não há fluxo "criar venda → outbox → handler → estoque/notif" em sequência.

#### Evidencia
- arquivo_ou_area: docs/ARCHITECTURE.md; docs/architecture/events.md

#### Impacto
- tecnico: Dev novo tem dificuldade em rastrear fluxos end-to-end
- negocio: Onboarding lento

#### Recomendacao
- acao_sugerida: Diagramas de sequência (Mermaid) para 3 fluxos (criar venda, enviar campanha, aceitar invite); acoplar com ADR-003 (outbox)
- prioridade: media

---

### ACH-007
- titulo: Apps (web, mobile, landing) não descritos individualmente em docs
- severidade: medio
- categoria: arquitetura
- status: confirmado
- resumo: `ARCHITECTURE.md` lista módulos mas não explica responsabilidade de cada app (ex.: web hospeda tRPC; mobile consome via tipos; landing é SSG).

#### Evidencia
- arquivo_ou_area: docs/ARCHITECTURE.md; docs/DEPLOYMENT.md (tabela de serviços)

#### Impacto
- tecnico: Confusão sobre onde ficam APIs
- negocio: Menor

#### Recomendacao
- acao_sugerida: Seção "Apps" com 3-5 linhas cada (tecnologia, URL, responsabilidade, integração)
- prioridade: media

---

### ACH-008
- titulo: Centralização de runbooks — `deploy/RUNBOOKS.md` sem índice em `docs/`
- severidade: medio
- categoria: descoberta-de-docs
- status: confirmado
- resumo: Runbooks vivem em `deploy/RUNBOOKS.md`; não há `docs/OPERATIONS.md` ou link em README.

#### Evidencia
- arquivo_ou_area: deploy/RUNBOOKS.md; README.md

#### Impacto
- tecnico: Runbooks existem mas invisíveis
- negocio: MTTR alto por desconhecimento

#### Recomendacao
- acao_sugerida: `docs/OPERATIONS.md` com índice + link para cada runbook; referenciar no README
- prioridade: media

---

### ACH-009
- titulo: DEPLOYMENT.md — failover/multi-region sem critério de gatilho
- severidade: medio
- categoria: roadmap-de-infra
- status: confirmado
- resumo: Seção "Failover" cita tarefas futuras (Postgres replication, Redis Sentinel, réplicas) mas sem critérios claros (ex.: "ao atingir X tenants, ativar").

#### Evidencia
- arquivo_ou_area: docs/DEPLOYMENT.md

#### Impacto
- tecnico: Decisão de escala empurrada para ad-hoc
- negocio: Risco em crescimento

#### Recomendacao
- acao_sugerida: Documentar gatilhos e SLOs correspondentes; alinhar com performance/ACH-001
- prioridade: media

---

### ACH-010
- titulo: Ausência de `docs/GLOSSARY.md`
- severidade: medio
- categoria: knowledge-base
- status: confirmado
- resumo: Termos internos (outbox, tenant, tenantId, DLQ, ADR, otb, etc.) não são definidos em um único lugar.

#### Evidencia
- arquivo_ou_area: docs/

#### Impacto
- tecnico: Onboarding lento; desentendimentos
- negocio: Documentação perde poder didático

#### Recomendacao
- acao_sugerida: `docs/GLOSSARY.md` com 15-25 termos, 2-3 linhas por termo + link para ADR/arquivo relevante
- prioridade: media

---

### ACH-011
- titulo: Comentários no código referenciam IDs opacos (`ACH-011`, etc.)
- severidade: medio
- categoria: documentacao-no-codigo
- status: confirmado
- resumo: 20+ ocorrências de comentários citando "ACH-###" sem contexto. Quem não é do time não entende; cross-ref codigo-manutenibilidade/ACH-019.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/health.ts; apps/api/src/lib/cache.ts; etc.

#### Impacto
- tecnico: Comentário perde valor
- negocio: Onboarding prejudicado

#### Recomendacao
- acao_sugerida: Substituir por comentário "WHY" + link para ADR/doc apropriado; manter referências ACH apenas em docs internas
- prioridade: media

---

### ACH-012
- titulo: Ausência de `CHANGELOG.md`
- severidade: medio
- categoria: historico-de-mudanca
- status: confirmado
- resumo: Sem changelog formal (Keep a Changelog) — mudanças ficam somente no git log.

#### Evidencia
- arquivo_ou_area: raiz (sem CHANGELOG)

#### Impacto
- tecnico: Rollbacks e decisões de release informais
- negocio: Comunicação de mudanças com stakeholders ausente

#### Recomendacao
- acao_sugerida: `CHANGELOG.md` (Keep a Changelog pt-BR) com versões + Unreleased; manter em cada release
- prioridade: media

---

### ACH-013
- titulo: ADRs "proposto" sem SLA de decisão (ADR-006 e ADR-008)
- severidade: medio
- categoria: governanca-de-arquitetura
- status: confirmado
- resumo: ADRs importantes (modelo AI e worker scaling) marcados como "proposto" sem data-alvo de decisão.

#### Evidencia
- arquivo_ou_area: docs/adr/006-ai-module-model.md; docs/adr/008-worker-scaling.md

#### Impacto
- tecnico: Roadmap preso em limbo
- negocio: Planejamento ambíguo

#### Recomendacao
- acao_sugerida: Acrescentar "Decisão esperada até YYYY-MM-DD, responsável: <nome>, fallback padrão: <opção>"
- prioridade: media

---

### ACH-014
- titulo: Docs sem "última revisão" nem política de atualização
- severidade: medio
- categoria: manutencao
- status: confirmado
- resumo: Nenhum arquivo técnico indica quando foi revisado pela última vez nem quando deve ser revisto (cross-ref compliance-privacidade/ACH-021).

#### Evidencia
- arquivo_ou_area: docs/**/*.md

#### Impacto
- tecnico: Risco de docs obsoletos
- negocio: Tomada de decisão sobre docs desatualizada

#### Recomendacao
- acao_sugerida: Rodapé "Última revisão: YYYY-MM-DD · Próxima revisão esperada: YYYY-MM-DD"; CI opcional para flag obsoleto
- prioridade: media

---

### ACH-015
- titulo: `CODE_OF_CONDUCT.md` ausente
- severidade: baixo
- categoria: governanca
- status: confirmado
- resumo: Esperado mesmo em projetos privados; estabelece padrão profissional. Sem este arquivo, não há política de conduta.

#### Evidencia
- arquivo_ou_area: raiz

#### Impacto
- tecnico: Baixo
- negocio: Sinaliza profissionalismo; pode influenciar parcerias

#### Recomendacao
- acao_sugerida: `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 pt-BR)
- prioridade: baixa

---

### ACH-016
- titulo: Tradução/localização de docs não definida
- severidade: baixo
- categoria: estrategia-de-docs
- status: confirmado
- resumo: Docs técnicas em inglês, begin docs em pt-BR. Estratégia não está documentada; falta decisão explícita.

#### Evidencia
- arquivo_ou_area: docs/ (inglês); begin/ (pt-BR)

#### Impacto
- tecnico: Inconsistência percebida
- negocio: Baixo

#### Recomendacao
- acao_sugerida: Documentar a decisão (ADR ou CONTRIBUTING): "docs técnicas em inglês; begin docs em pt-BR; tradução manual conforme necessidade"
- prioridade: baixa

---

### ACH-017
- titulo: README sem badges de CI / coverage / version
- severidade: baixo
- categoria: sinalizacao
- status: confirmado
- resumo: Sem sinal visual de saúde do projeto.

#### Evidencia
- arquivo_ou_area: README.md

#### Impacto
- tecnico: Cosmético
- negocio: Sinaliza maturidade

#### Recomendacao
- acao_sugerida: Quando CI estável, adicionar badges `[![Tests](…)]`, `[![Coverage](…)]`, `[![Version](…)]`
- prioridade: baixa

---

### ACH-018
- titulo: Cross-ref: achados de outros domínios que impactam documentação
- severidade: informativo
- categoria: cross-ref
- status: confirmado
- resumo: Documentos demandados por outros domínios reforçam lista de gaps documentais: PRIVACY_POLICY.md, SUB_PROCESSORS.md, DPIA.md, INCIDENT_RESPONSE_PRIVACY.md, DATA_RETENTION_POLICY.md (compliance); VERSIONING.md, FILTERING_AND_SORTING.md, EVENTS_SCHEMAS.md (apis); SLO.md, RUNBOOKS/OUTBOX_LAG.md (observabilidade); DR.md, BACKUP.md (dados/infra); OVERRIDES.md, LICENSING.md (supply-chain); PRICING.md (finops).

#### Evidencia
- arquivo_ou_area: cross-ref com compliance-privacidade/ACH-002-006-007-008-010-013-015; apis-integracoes/ACH-002-011-012-014; observabilidade/ACH-007-015; dados-persistencia/ACH-018-019; infra/ACH-002-003-004; supply-chain/ACH-005-007-008; custos-finops/ACH-008-010-011

#### Impacto
- tecnico: Backlog de docs mapeado para planejamento
- negocio: Melhora due diligence e compliance

#### Recomendacao
- acao_sugerida: Consolidar num plano de documentação (roadmap) com priorização (primeiro os itens críticos de compliance/security)
- prioridade: informativo
