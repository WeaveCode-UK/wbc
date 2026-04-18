---
kind: playbook
domain: documentacao-runbooks
version: "1.0"
status: ativo
---

# Playbook do Domínio: documentacao-runbooks

## Identificação
- dominio: documentacao-runbooks
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se a documentação técnica, operacional e arquitetural do projeto é suficiente para onboarding, manutenção, resposta a incidentes e continuidade de conhecimento em caso de rotatividade do time, sem depender exclusivamente de conhecimento tácito.

## Aplicabilidade
Este playbook se aplica a qualquer projeto em operação, especialmente quando houver:
- mais de uma pessoa mantenedora ou potencialmente mantenedora
- produto em produção com usuários reais
- integrações externas críticas
- incidentes operacionais possíveis
- time de plantão/on-call
- clientes/stakeholders externos ao time de engenharia
- processos de contratação/rotatividade esperáveis

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto é pessoal e não pretende ser mantido por terceiros
- não há operação em produção (puramente experimental ou didático)
- o ciclo de vida planejado é tão curto que documentar não justifica
- o escopo é exclusivamente biblioteca de código com README já cobrindo uso

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- avaliação da documentação de entrada (README, onboarding)
- avaliação da documentação arquitetural (diagramas, ADRs, decisões técnicas)
- avaliação dos runbooks operacionais (deploy, rollback, incident response)
- avaliação da documentação de integrações externas
- avaliação do processo de on-call e escalonamento
- identificação de conhecimento tácito não documentado
- identificação de documentação desatualizada em relação ao código
- consolidação dos riscos de continuidade de conhecimento
- recomendações priorizadas por impacto operacional

## Referencial Base do Playbook
Este playbook usa como baseline:
- princípios de Docs-as-Code (documentação versionada junto com código)
- convenções de ADR (Architecture Decision Records)
- boas práticas de runbook operacional e incident response
- padrões de onboarding técnico (time to first commit, time to first deploy)
- avaliação objetiva do que é observável no repositório e nos canais documentados

## Escopo Padrão da Run
- README principal e secundários
- docs/ ou equivalente
- ADRs ou documentos de decisão arquitetural
- diagramas (arquitetura, fluxo, sequência, ER)
- runbooks (deploy, rollback, rotina, troubleshooting)
- documentação de incidentes (playbooks, escalation, post-mortem)
- documentação de APIs internas e externas
- documentação de ambientes (dev, staging, prod)
- CHANGELOG e documentação de versão
- documentação de onboarding de novo dev

## Regras Gerais do Domínio
- Executar somente verificações pertinentes à documentação observável.
- Registrar achados apenas com evidência concreta (arquivo ausente, arquivo desatualizado, conhecimento inferido não documentado).
- Considerar documentação "adequada" aquela que permite a um dev novo, com skill relevante, ser produtivo em tempo razoável sem precisar perguntar a colegas.
- Priorizar achados de documentação crítica ausente (runbook de incidente, deploy) sobre achados estéticos (README pouco atrativo).
- Separar claramente ausência total, presença desatualizada, e presença adequada.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Desatualização de documentação deve ser verificada via comparação com código atual, não por data (data não é indicador confiável).

## Fases Oficiais da Run

### Fase 1 — Documentação de Entrada e Onboarding
#### Objetivo
Avaliar o que um dev novo encontra quando chega ao repositório pela primeira vez.

#### Checks Obrigatórios
- verificar existência e qualidade do README principal
- verificar se o README explica o que o projeto faz (1-2 parágrafos claros)
- verificar se há seção de setup local (clone → install → run em menos de 5 comandos)
- verificar se há instruções de teste, build e lint
- verificar se há arquivo CONTRIBUTING.md ou equivalente
- verificar se há doc de convenções (estilo de código, commits, branches, PRs)
- verificar se há doc de dependências externas necessárias (banco, serviços locais)
- identificar se há glossário de termos específicos do domínio

#### Evidências Esperadas
- README.md na raiz
- CONTRIBUTING.md
- docs/getting-started.md, docs/onboarding.md ou similar
- Makefile, justfile, scripts de setup
- .env.example com variáveis documentadas

#### Possíveis Achados
- README ausente, vazio ou apenas com título
- setup local que exige passos não documentados
- ausência de .env.example
- comandos de teste/build não documentados
- convenções existentes mas não declaradas (dev novo as descobre quebrando regras)
- glossário ausente para domínios de negócio complexos

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quanto esforço um dev novo precisa para começar
- quais lacunas específicas dificultam onboarding
- qual é a qualidade da primeira impressão do projeto

#### Condições de Bloqueio da Fase
- ausência total de documentação de entrada impedindo inferência do escopo
- conflito severo entre o que README diz e o que o código demonstra

---

### Fase 2 — Documentação Arquitetural e Decisões
#### Objetivo
Avaliar se as decisões arquiteturais e estrutura do sistema estão documentadas de forma útil para quem mantém o projeto.

#### Checks Obrigatórios
- identificar presença de ADRs (Architecture Decision Records) ou docs equivalentes
- verificar se há diagrama de arquitetura de alto nível
- verificar se há documentação de contratos entre módulos/serviços
- verificar se há documentação de fluxos críticos (sequência, caso de uso principal)
- verificar se escolhas tecnológicas têm justificativa documentada (por que X e não Y)
- identificar se há documentação de trade-offs aceitos (dívidas conhecidas, restrições)
- verificar consistência entre diagramas e código atual

#### Evidências Esperadas
- docs/adr/ ou docs/decisions/
- docs/architecture.md
- diagramas (drawio, mermaid, plantuml, PNG)
- arquitetura.md, arq.md, ARCHITECTURE.md
- comentários arquiteturais em código crítico

#### Possíveis Achados
- ausência de ADRs para decisões estruturais importantes
- diagrama desatualizado em relação ao código atual
- decisão arquitetural apenas na cabeça de alguém do time
- dívida técnica conhecida sem registro formal
- escolha tecnológica sem justificativa registrada
- diagrama existente mas ilegível ou excessivamente abstrato

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade e atualidade da documentação arquitetural
- capacidade de um mantenedor entender decisões sem acesso ao time original
- riscos de perda de conhecimento estrutural

#### Condições de Bloqueio da Fase
- ausência de código suficientemente descritivo para inferir arquitetura
- impossibilidade de avaliar atualidade sem contexto mínimo

---

### Fase 3 — Runbooks Operacionais
#### Objetivo
Avaliar a documentação de operações críticas: deploy, rollback, restart, rotação, escalonamento.

#### Checks Obrigatórios
- verificar existência de runbook de deploy passo a passo
- verificar existência de runbook de rollback (como reverter em minutos)
- verificar existência de runbook de restart de serviços críticos
- verificar existência de runbook de rotação de segredos/chaves
- verificar existência de runbook de escalonamento (subir/descer capacidade)
- verificar existência de runbook de failover ou switch de região
- verificar existência de runbook de backup e restore
- verificar se os runbooks têm comandos exatos (não só descrições vagas)
- verificar se os runbooks mencionam quem autoriza cada ação

#### Evidências Esperadas
- docs/runbooks/ ou equivalente
- RUNBOOK.md, OPERATIONS.md, DEPLOY.md
- scripts operacionais commentados
- referências a runbooks em monitores/dashboards
- procedimentos documentados em wiki interno referenciado

#### Possíveis Achados
- deploy feito "de cabeça" sem runbook escrito
- rollback que depende de memória/sorte
- ausência de runbook de restore de backup
- rotação de segredos sem procedimento
- runbook que existe mas está desatualizado em relação à infra atual
- procedimentos que exigem aprovação mas sem definir quem aprova
- runbook com comandos que não funcionam mais (tooling mudou)

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- cobertura de operações críticas em runbooks
- qualidade dos procedimentos documentados
- risco operacional em caso de pessoa-chave indisponível

#### Condições de Bloqueio da Fase
- impossibilidade de identificar operações críticas sem contexto do projeto
- ausência de infra observável que permita avaliar runbooks pertinentes

---

### Fase 4 — Resposta a Incidentes e On-Call
#### Objetivo
Avaliar a documentação que um engenheiro de plantão precisa para responder a incidentes fora do horário comercial.

#### Checks Obrigatórios
- verificar existência de playbook de resposta a incidentes
- verificar existência de árvore de decisão inicial (sintoma → ação imediata)
- verificar existência de lista de contatos/escalation
- verificar existência de troubleshooting guide para erros comuns
- verificar existência de dashboards e alertas documentados (o que significa cada alerta)
- verificar se há processo de post-mortem definido
- verificar se post-mortems anteriores estão arquivados e acessíveis
- verificar se há SLA/SLO documentado para o time saber o que está em jogo

#### Evidências Esperadas
- docs/incident-response/, docs/on-call/
- INCIDENT_RESPONSE.md, ON_CALL.md
- pasta de post-mortems
- referência a ferramentas (PagerDuty, Opsgenie) e configurações
- runbook "primeira hora" para tipos comuns de incidente

#### Possíveis Achados
- ausência de playbook de resposta a incidentes
- on-call sem documentação de como responder
- sem troubleshooting de erros comuns (cada incidente investigado do zero)
- post-mortems não arquivados ou não compartilhados
- alertas sem documentação de significado/ação
- SLA/SLO desconhecido pelo time de plantão
- escalation chain desatualizada (pessoas que saíram ainda listadas)

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- preparo do time para responder a incidentes
- qualidade da documentação de sintomas comuns
- capacidade institucional de aprender com incidentes anteriores

#### Condições de Bloqueio da Fase
- ausência de qualquer contexto sobre on-call ou responsabilidade operacional
- impossibilidade de avaliar sem acesso a registros de incidentes anteriores

---

### Fase 5 — Documentação de APIs e Integrações
#### Objetivo
Avaliar a documentação de APIs oferecidas pelo sistema e das integrações externas consumidas.

#### Checks Obrigatórios
- verificar existência de documentação de API pública (OpenAPI, Swagger, GraphQL schema com descrições)
- verificar existência de exemplos de uso (curl, Postman, insomnia)
- verificar documentação de autenticação e autorização para consumidores
- verificar documentação de rate limits, quotas, versionamento
- verificar documentação de integrações externas consumidas (o que cada uma faz, como falha, como debugar)
- verificar documentação de webhooks produzidos e consumidos
- verificar se breaking changes têm processo documentado

#### Evidências Esperadas
- openapi.yaml, swagger.json, schema.graphql
- docs/api/, docs/integrations/
- exemplos em docs/examples/
- referências em comentários de código
- collection Postman/Insomnia commitada

#### Possíveis Achados
- API sem documentação pública
- documentação autogerada mas sem descrições úteis (só tipos)
- ausência de exemplos reais de uso
- autenticação documentada de forma incompleta
- integração externa crítica sem explicação de como funciona
- webhooks sem documentação de formato/retry/idempotência
- breaking changes sem registro

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade da documentação para consumidores de API
- qualidade da documentação de integrações para mantenedores
- riscos de integração mal entendida

#### Condições de Bloqueio da Fase
- impossibilidade de identificar se o projeto oferece API externa ou é apenas interno

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades (priorizar runbook de incidente ausente sobre README estético)
- revisar status dos achados
- separar achados de documentação de achados primariamente de outros domínios
- destacar lacunas de documentação crítica operacional

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes a arquivos ou sua ausência
- severidades coerentes com impacto operacional

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- classificação inadequada
- lacuna operacional crítica subavaliada

#### Critério de Conclusão da Fase
Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar

---

### Fase 7 — Preparação para Finalização
#### Objetivo
Preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios
- revisar escopo executado
- revisar escopo não coberto
- preencher `relatorio-final.md`
- confirmar lacunas críticas prioritárias
- confirmar recomendações prioritárias
- verificar se existem bloqueios abertos
- confirmar avaliação geral do domínio

#### Evidências Esperadas
- `relatorio-final.md` preenchido
- `acompanhamento.md` com próximo passo coerente
- `metadata.md` pronto para transição de estado

#### Possíveis Achados
- run incompleta
- recomendação insuficiente
- bloqueio em aberto
- relatório final inconsistente
- lacuna crítica mal resumida

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- bloqueio crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Documentação de Entrada e Onboarding
2. Documentação Arquitetural e Decisões
3. Runbooks Operacionais
4. Resposta a Incidentes e On-Call
5. Documentação de APIs e Integrações
6. Consolidação de Achados
7. Preparação para Finalização

## Regras de Execução da Run Baseada neste Playbook
1. O Prompt 02 deve usar este playbook para inicializar:
   - objetivo da run
   - escopo da run
   - fases planejadas
   - fase atual inicial
   - próximo passo obrigatório
2. O Prompt 03 deve executar as fases deste playbook na ordem oficial.
3. Não pular fase sem justificativa explícita.
4. Se uma fase não for aplicável, registrar `nao_aplicavel` com justificativa.
5. Se houver impedimento real, mudar a run para `blocked`.
6. Se todas as fases aplicáveis forem concluídas, preparar transição para `ready_for_finalize`.

## Critérios para `ready_for_finalize`
A run só pode ser marcada como `ready_for_finalize` quando:
- todas as fases aplicáveis estiverem concluídas ou justificadamente marcadas como `nao_aplicavel`
- `achados.md` estiver consolidado
- `relatorio-final.md` estiver preenchido
- `acompanhamento.md` estiver atualizado
- não houver bloqueios abertos sem decisão registrada

## Situações Típicas de Bloqueio
- ausência total de documentação que permita avaliação básica
- impossibilidade de inferir operação sem contexto mínimo
- conflito grave entre documentação e código sem base suficiente para leitura

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita documentação como disciplina de continuidade de conhecimento operacional.
- Foco não é estética — é utilidade. Documentação bonita mas desatualizada é pior que documentação rústica mas correta.
- Quando um problema de outro domínio (arquitetura mal pensada, deploy frágil) gerar necessidade de documentação extra compensatória, pode ser citado aqui como gap operacional, mas a causa-raiz pertence ao domínio original.
- A ausência de documentação de algo simples (README claro) é achado de severidade baixa; a ausência de runbook de incidente de produção é severidade alta.
