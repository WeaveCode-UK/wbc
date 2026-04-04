# Playbook do Domínio: confiabilidade-resiliencia

## Identificação
- dominio: confiabilidade-resiliencia
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o sistema continua executando sua função corretamente diante de falhas, degradações, picos de carga, indisponibilidade parcial de dependências e condições anormais de operação, além de verificar se ele consegue se recuperar de forma previsível.

## Aplicabilidade
Este playbook se aplica a qualquer projeto com runtime real, especialmente quando houver:
- APIs
- serviços backend
- jobs assíncronos
- workers
- filas
- integrações externas
- bancos de dados
- múltiplos serviços ou módulos
- dependências de terceiros
- necessidade de alta disponibilidade ou continuidade operacional

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o sistema for apenas uma biblioteca local sem operação própria
- não houver runtime ou dependências externas relevantes no escopo
- certos mecanismos como filas, retries ou failover não fizerem sentido para o tipo de aplicação auditada

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara dos modos de falha relevantes do sistema
- avaliação de tolerância a falhas e recuperação
- avaliação de mecanismos de timeout, retry, fallback, isolamento, load shedding e degradação graciosa quando aplicáveis
- avaliação de riscos de cascading failure e overload
- avaliação de readiness para recuperação e continuidade operacional
- recomendações práticas priorizadas para aumentar a confiabilidade do sistema

## Referencial Base do Playbook
Este playbook usa como baseline:
- prevenção e contenção de cascading failures
- manejo de overload com proteção explícita do sistema
- recuperação automática ou semi-automática quando aplicável
- redução de blast radius
- tratamento de dependências frágeis
- desenho orientado a continuidade de operação e recuperação previsível

## Escopo Padrão da Run
- modos de falha do sistema
- dependências críticas e pontos únicos de falha
- timeouts, retries, backoff e circuit breaking quando aplicáveis
- idempotência e proteção contra duplicidade
- filas, jobs e reprocessamento
- overload, load shedding e backpressure
- failover, recuperação e continuidade operacional
- quotas, limites e saturação
- degradação graciosa e blast radius
- readiness para incidentes e recuperação

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com confiabilidade e resiliência.
- Não expandir para segurança, UX ou observabilidade detalhada, salvo quando houver impacto direto na confiabilidade.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar falhas que interrompem função correta, ampliam impacto, dificultam recuperação ou aumentam risco de cascata.
- Diferenciar falha isolada, fragilidade de desenho, risco de saturação e ausência de mecanismo de recuperação.

## Fases Oficiais da Run

### Fase 1 — Modos de Falha, Dependências e Blast Radius
#### Objetivo
Mapear as dependências críticas do sistema, seus modos de falha prováveis e o potencial de blast radius associado a indisponibilidade, latência, erro ou saturação.

#### Checks Obrigatórios
- identificar dependências críticas internas e externas
- identificar pontos únicos de falha aparentes
- verificar se o sistema depende de componentes centrais sem isolamento suficiente
- mapear caminhos síncronos e assíncronos críticos
- verificar se a falha de uma dependência pode interromper todo o sistema ou apenas parte dele
- verificar se existe separação razoável entre caminhos críticos e não críticos

#### Evidências Esperadas
- arquitetura runtime
- integração com bancos, filas, caches, serviços externos e provedores
- código de clientes de dependência
- configuração de conexão e chamadas externas
- fluxos de negócio e caminhos críticos
- documentação técnica ou operacional, se existir

#### Possíveis Achados
- dependência crítica sem isolamento
- ponto único de falha
- blast radius excessivo
- caminho crítico dependente de componente frágil
- acoplamento excessivo com serviço externo
- degradação global provável a partir de falha localizada

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais dependências e componentes são críticos
- como falhas neles impactam o sistema
- onde existem riscos maiores de blast radius

#### Condições de Bloqueio da Fase
- impossibilidade de identificar dependências críticas
- ausência de acesso suficiente ao runtime ou fluxos principais
- inconsistência severa que impeça mapear modos de falha básicos

---

### Fase 2 — Timeouts, Retries, Backoff, Idempotência e Contenção
#### Objetivo
Avaliar se o sistema reage adequadamente a falhas temporárias e evita amplificar problemas por meio de retries cegos, ausência de timeout ou reprocessamento inseguro.

#### Checks Obrigatórios
- verificar existência de timeouts explícitos em chamadas externas ou operações críticas quando aplicável
- verificar uso de retries e se eles possuem limites razoáveis
- verificar presença de backoff e, quando fizer sentido, jitter
- verificar risco de retry storm ou amplificação de erro
- verificar se operações reexecutáveis são idempotentes quando necessário
- verificar proteção contra duplicidade em jobs, filas, webhooks ou integrações
- verificar se erros permanentes e transitórios parecem ser tratados de forma diferente

#### Evidências Esperadas
- clients HTTP/RPC
- config de timeout e retry
- wrappers, middlewares ou resilience libraries
- processamento assíncrono, workers e filas
- mecanismos de idempotency key, deduplication ou controle equivalente
- logs, traces ou código de tratamento de falha

#### Possíveis Achados
- ausência de timeout
- retry sem limite ou sem backoff
- retry em operação não idempotente
- risco de duplicidade
- tempestade de retries
- tratamento igual para erro transitório e erro permanente
- reprocessamento inseguro
- contenção insuficiente de falhas

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade dos mecanismos de timeout/retry
- risco de amplificação de falhas
- proteção contra duplicidade e reexecução incorreta

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às integrações e operações reexecutáveis
- impossibilidade de inferir política de timeout/retry
- conflito severo entre configuração, código e comportamento esperado

---

### Fase 3 — Overload, Cascading Failure, Load Shedding e Backpressure
#### Objetivo
Avaliar se o sistema possui mecanismos para sobreviver a overload e impedir que falhas ou saturações locais se transformem em falhas em cascata.

#### Checks Obrigatórios
- verificar risco de overload em caminhos críticos
- verificar se o sistema aplica limitação, shedding, throttle, queue bounding ou mecanismo equivalente quando aplicável
- verificar risco de cascata entre componentes dependentes
- verificar se existe backpressure, rejeição controlada ou degradação sob saturação
- verificar se circuit breaker, bulkhead ou isolamento equivalente aparecem onde fariam sentido
- verificar se chamadas síncronas em cadeia podem colapsar o sistema sob pressão
- verificar se quotas, limites e pools relevantes são monitorados ou tratados

#### Evidências Esperadas
- middlewares e libs de resiliência
- filas, limites e pools
- tratamento de saturação
- caminhos de chamada entre serviços
- política de shedding, throttling ou limites
- documentação operacional ou sinais de comportamento sob carga, se existirem

#### Possíveis Achados
- sistema vulnerável a overload
- ausência de load shedding
- ausência de backpressure
- risco de cascading failure
- pool ou quota sem tratamento
- componente saturável central
- cadeia síncrona frágil
- bulkhead/isolamento ausente onde seria esperado

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- risco de overload
- risco de falha em cascata
- mecanismos existentes ou ausentes de contenção e proteção

#### Condições de Bloqueio da Fase
- falta de evidência mínima sobre caminhos críticos e limites
- impossibilidade de inferir comportamento de saturação
- inconsistência grave entre desenho e operação esperada

---

### Fase 4 — Recuperação, Failover, Continuidade e Estado
#### Objetivo
Avaliar se o sistema consegue recuperar-se de falhas e continuar operando de forma previsível, com tratamento adequado de estado, reprocessamento e retomada.

#### Checks Obrigatórios
- verificar se há mecanismos de recuperação automática quando aplicável
- verificar se serviços, jobs ou processos conseguem retomar após falha
- verificar como o sistema lida com estado parcial, mensagens pendentes ou transações interrompidas
- verificar existência de DLQ, replay, reprocessamento ou mecanismo equivalente quando fizer sentido
- verificar se existe failover, redundância ou fallback em componentes críticos quando aplicável
- verificar se dependências e stores críticos possuem estratégia mínima de continuidade
- verificar se quotas ou limites de plataforma podem interromper recuperação

#### Evidências Esperadas
- workers, filas, consumers e políticas de erro
- DLQ, retry queue, replay tools ou equivalentes
- config de restart e autorecovery
- mecanismos de failover ou redundância
- documentação de continuidade ou recuperação
- tratamento de estado parcial e reconciliação

#### Possíveis Achados
- recuperação manual demais
- ausência de mecanismo de retomada
- falha parcial deixa sistema em estado inconsistente
- fila/job sem estratégia de reprocessamento
- DLQ ausente onde seria esperada
- redundância insuficiente
- failover inexistente em ponto crítico
- quota/limite impede recuperação segura

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- capacidade do sistema de se recuperar
- fragilidades de continuidade operacional
- riscos de estado inconsistente ou perda de processamento

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos fluxos de recuperação
- impossibilidade de inferir comportamento pós-falha
- inconsistência grave entre desenho de continuidade e implementação real

---

### Fase 5 — Readiness Operacional para Confiabilidade
#### Objetivo
Avaliar se o sistema possui base operacional mínima para sustentar confiabilidade ao longo do tempo, incluindo testes de resiliência, limites conhecidos e disciplina de operação.

#### Checks Obrigatórios
- verificar se existem metas, limites ou critérios conhecidos de disponibilidade/continuidade quando aplicável
- verificar se o sistema parece preparado para testar resiliência ou falha controlada
- verificar se quotas e limites de plataforma relevantes são conhecidos e tratados
- verificar se runbooks, procedimentos ou automações de recuperação existem quando seriam esperados
- verificar se há evidência de que falhas previsíveis foram consideradas no desenho operacional
- verificar se a operação depende de intervenção manual excessiva para manter o serviço funcionando

#### Evidências Esperadas
- documentação de operação
- runbooks, se existirem
- configs de autoscaling, autorestart, failover ou recovery
- limites e quotas conhecidos
- testes de resiliência, caos ou drills, se existirem
- sinais de automação de cura ou mitigação

#### Possíveis Achados
- ausência de readiness operacional
- quota crítica não tratada
- recuperação depende de ação manual excessiva
- runbook inexistente em área crítica
- confiabilidade não testada
- falhas previsíveis não consideradas
- automação de cura ausente onde seria útil

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- maturidade operacional de confiabilidade
- riscos previsíveis ainda não tratados
- dependência excessiva de heroics humanos

#### Condições de Bloqueio da Fase
- ausência total de artefatos operacionais em sistema que claramente deveria tê-los
- impossibilidade de inferir readiness mínima
- conflito grave entre requisitos operacionais e meios de recuperação observáveis

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de confiabilidade/resiliência de achados cujo núcleo pertença a outro domínio
- destacar riscos de indisponibilidade, cascata, duplicidade e recuperação deficiente

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre fragilidade de desenho, risco operacional e falha confirmada de confiabilidade

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco crítico de indisponibilidade subavaliado

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
- risco de indisponibilidade mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Modos de Falha, Dependências e Blast Radius
2. Timeouts, Retries, Backoff, Idempotência e Contenção
3. Overload, Cascading Failure, Load Shedding e Backpressure
4. Recuperação, Failover, Continuidade e Estado
5. Readiness Operacional para Confiabilidade
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
- conflito grave entre desenho, documentação e comportamento esperado sob falha

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita confiabilidade e resiliência como capacidade de continuar operando corretamente e recuperar-se de falhas.
- Problemas profundos de observabilidade, arquitetura, performance, testes ou infraestrutura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente indisponibilidade, recuperação, overload ou risco de cascata, ele pode ser citado aqui como impacto de confiabilidade, sem substituir a auditoria específica daquele domínio.
