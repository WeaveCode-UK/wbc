# Playbook do Domínio: observabilidade-operacao

## Identificação
- dominio: observabilidade-operacao
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o sistema oferece visibilidade operacional suficiente para detectar problemas, diagnosticar falhas, acompanhar comportamento em produção e sustentar operação contínua com baixo nível de adivinhação manual.

## Aplicabilidade
Este playbook se aplica a qualquer projeto com ambiente de execução real, especialmente quando houver:
- backend
- API
- jobs assíncronos
- workers
- frontend com chamadas distribuídas
- múltiplos serviços ou módulos relevantes
- deploy em cloud, containers ou infraestrutura compartilhada
- necessidade de suporte, on-call ou troubleshooting

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto ainda não possui ambiente executável real
- o sistema é apenas uma biblioteca sem operação própria
- não existem processos, serviços, endpoints ou runtime observáveis no escopo
- certas práticas específicas, como probes de readiness, não fizerem sentido para o tipo de runtime auditado

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara da telemetria disponível
- avaliação de logs, métricas, traces e correlação operacional
- avaliação de health checks, readiness e diagnósticos básicos
- avaliação da qualidade de monitoramento e alerting
- identificação de pontos cegos operacionais
- recomendações práticas para melhorar suporte, troubleshooting e confiabilidade operacional

## Referencial Base do Playbook
Este playbook usa como baseline:
- telemetria com foco em logs, métricas e traces
- correlação entre sinais e contexto de execução
- monitoramento orientado a sintomas reais e impacto operacional
- alerting acionável e não ruidoso
- health checks e readiness como mecanismos operacionais fundamentais
- redução de toil operacional por meio de melhor visibilidade e automação diagnóstica

## Escopo Padrão da Run
- sinais de observabilidade disponíveis
- instrumentação e cobertura básica
- logs e estrutura de logging
- métricas e indicadores operacionais
- traces e correlação entre fluxos
- health checks, liveness, readiness, startup e endpoints equivalentes
- monitoramento, alertas e sintomas operacionais
- contexto e cardinalidade útil dos dados observáveis
- suporte a troubleshooting, on-call e redução de toil

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com observabilidade e operação.
- Não expandir para segurança, performance ou arquitetura detalhada, salvo quando houver impacto operacional direto.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar capacidade real de detectar, diagnosticar e agir sobre problemas.
- Diferenciar ausência de sinal, baixa qualidade do sinal e excesso de ruído operacional.

## Fases Oficiais da Run

### Fase 1 — Sinais de Telemetria e Cobertura Básica
#### Objetivo
Identificar quais sinais de telemetria o sistema realmente emite, onde são gerados e quão ampla é a cobertura observável dos fluxos principais.

#### Checks Obrigatórios
- identificar se o sistema produz logs, métricas e traces, total ou parcialmente
- identificar bibliotecas, SDKs, collectors, exporters ou integrações de observabilidade
- verificar quais serviços, módulos, jobs ou fluxos principais possuem instrumentação
- verificar se a cobertura observável inclui os caminhos críticos do sistema
- identificar gaps óbvios de instrumentação em áreas importantes
- verificar se existe contexto de recurso/serviço suficientemente claro na telemetria

#### Evidências Esperadas
- bibliotecas e dependências de observabilidade
- configurações de collector/exporter
- middlewares, interceptors, instrumentação manual ou automática
- logs emitidos, métricas expostas, traces exportados
- documentação operacional ou README técnico
- dashboards, queries ou referências de runtime quando existirem

#### Possíveis Achados
- ausência de um ou mais sinais fundamentais
- cobertura observável parcial em fluxos críticos
- instrumentação inconsistente entre componentes
- telemetria sem contexto claro de serviço/recurso
- instrumentação presente mas não útil para diagnóstico
- pontos cegos importantes em jobs, filas, workers ou integrações

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais sinais existem
- onde estão instrumentados
- quais fluxos principais estão cobertos ou descobertos

#### Condições de Bloqueio da Fase
- impossibilidade de identificar o runtime observável do sistema
- ausência de acesso à instrumentação mínima ou aos artefatos de telemetria
- inconsistência severa que impeça mapear sinais básicos

---

### Fase 2 — Logs, Estrutura, Contexto e Diagnóstico
#### Objetivo
Avaliar se os logs são estruturados, úteis para diagnóstico e suficientemente contextualizados para troubleshooting real.

#### Checks Obrigatórios
- verificar se o sistema produz logs relevantes nos pontos críticos
- verificar se os logs possuem estrutura útil e consistência mínima
- verificar presença de contexto operacional relevante, como service, environment, request, tenant, user, job, trace ou correlation identifiers quando aplicável
- verificar se erros, warnings e eventos importantes são registrados com densidade adequada
- verificar se os logs evitam excesso de ruído e também evitam silêncio excessivo
- verificar se segredos ou dados sensíveis não estão sendo logados indevidamente
- verificar se o formato dos logs permite filtro, busca e correlação prática

#### Evidências Esperadas
- chamadas de logging no código
- configuração de logger
- exemplos de logs emitidos
- filtros/redaction, se existirem
- pipelines de agregação ou forwarding quando existirem
- handlers de erro e exceção

#### Possíveis Achados
- logs ausentes em fluxos críticos
- logs pouco estruturados
- contexto insuficiente para diagnóstico
- excesso de ruído
- logs inúteis ou genéricos demais
- ausência de correlação entre eventos
- logs com exposição de dado sensível
- tratamento de erro sem visibilidade operacional suficiente

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- utilidade dos logs
- estrutura e contexto operacional
- capacidade de diagnóstico com base em logs

#### Condições de Bloqueio da Fase
- impossibilidade de acessar exemplos ou pontos de emissão de log
- ausência total de logging observável no escopo
- inconsistência severa entre runtime e geração de logs

---

### Fase 3 — Métricas, Traces e Correlação Operacional
#### Objetivo
Avaliar se o sistema mede comportamento operacional relevante e se os sinais permitem correlação entre componentes e sintomas.

#### Checks Obrigatórios
- verificar existência de métricas de aplicação e/ou runtime úteis
- verificar se há indicadores para throughput, erro, latência, filas, jobs, consumo ou outros comportamentos relevantes
- verificar se traces ou mecanismos equivalentes existem para fluxos distribuídos
- verificar se spans, operações ou etapas críticas possuem semântica minimamente útil
- verificar correlação entre logs, métricas e traces quando aplicável
- verificar se labels/dimensões/chaves de contexto parecem úteis e controladas
- verificar risco de cardinalidade excessiva ou ausência de tags fundamentais
- verificar se o sistema permite seguir um incidente do sintoma até a causa provável com base na telemetria

#### Evidências Esperadas
- endpoints de métricas ou exporters
- dashboards, painéis e queries
- instrumentação de traces
- trace IDs, span IDs, correlation IDs ou equivalentes
- medições de jobs, filas, retries, workers, integração externa ou runtime
- configuração de sampling, quando aplicável

#### Possíveis Achados
- métricas ausentes ou insuficientes
- traces inexistentes em sistema distribuído
- telemetria sem correlação útil
- latência sem decomposição
- erro sem contagem/segmentação adequada
- cardinalidade excessiva
- falta de contexto para navegar do sintoma à causa
- painel existe, mas não responde a perguntas operacionais relevantes

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade e utilidade das métricas
- qualidade e utilidade dos traces
- existência ou ausência de correlação operacional entre sinais

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às métricas ou traces
- incapacidade de inferir como o sistema mede comportamento operacional
- forte inconsistência entre instrumentação declarada e sinais reais observáveis

---

### Fase 4 — Health Checks, Readiness e Operação Básica
#### Objetivo
Avaliar se o sistema expõe sinais operacionais básicos de saúde, prontidão e startup que permitam operação segura e reação adequada do runtime/plataforma.

#### Checks Obrigatórios
- verificar existência de health checks ou endpoints equivalentes
- verificar distinção entre liveness, readiness e startup quando o runtime/plataforma comportar isso
- verificar se checks realmente refletem capacidade operacional útil
- verificar se componentes dependentes relevantes influenciam readiness de forma coerente quando aplicável
- verificar se o sistema evita checks puramente cosméticos
- verificar se há mecanismos mínimos para diagnosticar falhas de dependências críticas
- verificar se jobs, workers ou processos não HTTP possuem equivalentes operacionais quando apropriado

#### Evidências Esperadas
- endpoints `/health`, `/live`, `/ready`, `/startup` ou equivalentes
- config de probes em manifests, compose, helm ou runtime config
- código dos checks
- documentação de operação
- evidências de comportamento de readiness/liveness/startup

#### Possíveis Achados
- ausência de health check
- readiness ausente ou cosmética
- liveness enganosa
- startup não distinguido de readiness
- check que não representa capacidade real do serviço
- dependência crítica ignorada em prontidão operacional
- processo não HTTP sem mecanismo equivalente de saúde

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- como o sistema expõe saúde e prontidão
- se esses sinais ajudam de fato a operação
- onde existem pontos cegos operacionais

#### Condições de Bloqueio da Fase
- impossibilidade de acessar runtime ou configuração mínima de health checks
- ausência total de artefatos que permitam inferir estratégia de saúde operacional
- conflito grave entre probes declaradas e comportamento real esperado

---

### Fase 5 — Monitoramento, Alerting e Toil Operacional
#### Objetivo
Avaliar se a observabilidade do sistema sustenta monitoramento acionável, alertas úteis e redução de trabalho operacional repetitivo e reativo.

#### Checks Obrigatórios
- verificar existência de painéis, monitores, regras de alerta ou mecanismos equivalentes
- verificar se os alertas parecem orientados a sintomas úteis e não apenas a ruído técnico irrelevante
- verificar se existe separação entre sinais informativos e sinais que justificam ação humana
- verificar se os alertas parecem acionáveis
- verificar se o sistema fornece contexto suficiente para on-call ou troubleshooting rápido
- verificar se há evidências de toil operacional evitável por falta de visibilidade ou automação
- verificar se eventos importantes podem ser investigados sem caça manual excessiva em múltiplos lugares

#### Evidências Esperadas
- dashboards
- regras de alerta
- documentação de operação
- runbooks, se existirem
- logs, métricas e traces correlacionados
- indícios de procedimentos operacionais recorrentes

#### Possíveis Achados
- ausência de alerting útil
- alerta ruidoso e não acionável
- monitoramento sem vínculo claro com experiência do sistema
- falta de contexto para resposta operacional
- troubleshooting excessivamente manual
- toil recorrente por baixa visibilidade
- dashboards decorativos sem utilidade operacional

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- utilidade do monitoramento
- qualidade do alerting
- capacidade real de operar o sistema com baixo atrito

#### Condições de Bloqueio da Fase
- ausência de qualquer artefato de monitoramento/alerta em sistema que claramente deveria tê-los
- falta de evidência suficiente para inferir prática operacional mínima
- conflito severo entre sinais disponíveis e operação esperada

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de observabilidade/operação de achados cujo núcleo pertença a outro domínio
- destacar pontos cegos e gargalos diagnósticos prioritários

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- diferenciação entre ausência de sinal, má qualidade de sinal e excesso de ruído

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- ponto cego crítico subavaliado

#### Critério de Conclusão da Fase
Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run

---

### Fase 7 — Preparação para Finalização
#### Objetivo
Preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios
- revisar escopo executado
- revisar escopo não coberto
- preencher `relatorio-final.md`
- confirmar riscos prioritários
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
- ponto cego crítico mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- lacuna crítica de diagnóstico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Sinais de Telemetria e Cobertura Básica
2. Logs, Estrutura, Contexto e Diagnóstico
3. Métricas, Traces e Correlação Operacional
4. Health Checks, Readiness e Operação Básica
5. Monitoramento, Alerting e Toil Operacional
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
- ausência de estrutura mínima para verificar o domínio
- inconsistência estrutural da run
- evidência insuficiente para avançar com segurança
- conflito grave entre instrumentação, documentação e comportamento operacional observado

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita observabilidade e operabilidade do sistema.
- Problemas profundos de arquitetura, segurança, performance, testes ou infraestrutura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente a capacidade de detectar, diagnosticar ou operar o sistema, ele pode ser citado aqui como impacto operacional, sem substituir a auditoria específica daquele domínio.
