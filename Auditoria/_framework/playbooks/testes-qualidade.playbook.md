# Playbook do Domínio: testes-qualidade

## Identificação
- dominio: testes-qualidade
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o projeto possui uma estratégia de testes e qualidade de entrega capaz de fornecer sinal confiável, prevenir regressões relevantes e sustentar evolução contínua com risco controlado.

## Aplicabilidade
Este playbook se aplica a qualquer projeto em evolução com código executável, especialmente quando houver:
- regras de negócio relevantes
- APIs
- frontend
- integrações entre serviços
- pipelines CI/CD
- deploy frequente
- necessidade de refactoring contínuo
- múltiplos módulos ou serviços
- risco real de regressão

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto estiver em estágio muito inicial e ainda não houver estratégia de testes minimamente formada
- não existirem fluxos executáveis ou entregáveis testáveis no escopo
- certos tipos de teste, como E2E, contrato ou visual, não fizerem sentido para o tipo de sistema auditado

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara da estratégia de testes existente
- avaliação da distribuição entre testes unitários, integração, contrato e E2E quando aplicáveis
- avaliação da confiabilidade do sinal de teste
- avaliação de flakiness, isolamento e hermeticidade
- avaliação da qualidade do pipeline de validação
- consolidação dos principais riscos de regressão e recomendações práticas

## Referencial Base do Playbook
Este playbook usa como baseline:
- qualidade de produto sustentada por verificação automatizada relevante
- portfólio equilibrado de testes com predominância de testes mais baratos e rápidos
- testes isolados e independentes entre si
- combate explícito à flakiness e à perda de confiança no sinal
- uso de contract testing quando integrações entre consumidores e providers justificarem
- pipelines que tratam falha de teste como sinal de qualidade, não como burocracia

## Escopo Padrão da Run
- estratégia e portfólio de testes
- cobertura útil de regras críticas
- distribuição entre unit, integration, contract e e2e
- isolamento e hermeticidade
- flakiness e estabilidade da suíte
- fixtures, doubles e dependências externas
- qualidade do pipeline CI/CD
- critérios de merge/release
- sinais de regressão não protegida
- readiness para evolução segura

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com testes e qualidade de entrega.
- Não expandir para arquitetura, segurança ou performance detalhada, salvo quando houver impacto direto no sinal dos testes.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar problemas que reduzam confiança no sinal, deixem regras críticas sem proteção ou aumentem custo de regressão.
- Diferenciar claramente:
  - ausência de teste
  - cobertura irrelevante
  - teste frágil
  - flakiness
  - lacuna estrutural de estratégia

## Fases Oficiais da Run

### Fase 1 — Estratégia de Testes, Portfólio e Cobertura Relevante
#### Objetivo
Entender quais tipos de teste existem, como estão distribuídos e se o projeto protege de fato os fluxos e regras mais importantes.

#### Checks Obrigatórios
- identificar tipos de teste existentes no projeto
- verificar distribuição entre testes de baixo nível, integração e broad-stack/E2E
- verificar se regras de negócio críticas possuem proteção automatizada
- verificar se caminhos de alto risco de regressão estão cobertos
- verificar se há excesso de confiança em um único tipo de teste
- verificar se a estratégia parece intencional ou apenas oportunística

#### Evidências Esperadas
- estrutura de diretórios de testes
- convenções de nomenclatura de testes
- runners, frameworks e configs
- suites unit, integration, contract, e2e ou equivalentes
- documentação de estratégia de testes, se existir
- fluxos críticos do sistema e sua proteção correspondente

#### Possíveis Achados
- ausência de estratégia clara
- portfólio desequilibrado
- regras críticas sem testes
- excesso de dependência em E2E/UI
- cobertura concentrada em código trivial
- teste automatizado sem alinhamento com risco real

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais tipos de teste existem
- como estão distribuídos
- quais áreas críticas estão protegidas ou descobertas

#### Condições de Bloqueio da Fase
- impossibilidade de localizar a suíte de testes
- ausência de acesso suficiente aos artefatos de teste
- inconsistência severa que impeça mapear minimamente a estratégia existente

---

### Fase 2 — Isolamento, Hermeticidade e Confiabilidade do Sinal
#### Objetivo
Avaliar se os testes são independentes, reproduzíveis e pouco sensíveis a ordem de execução, estado residual ou dependências externas instáveis.

#### Checks Obrigatórios
- verificar se os testes são isolados e não dependem de ordem
- verificar se há dependência frágil de ambiente, rede, hora, estado compartilhado ou dados mutáveis
- verificar se fixtures, setup e teardown são coerentes
- verificar se doubles, mocks, stubs ou fakes são usados de forma que reduzam fragilidade sem mascarar comportamento crítico
- verificar se testes broad-stack ou E2E possuem grau razoável de hermeticidade quando aplicável
- verificar se a suíte depende demais de ambientes compartilhados instáveis

#### Evidências Esperadas
- fixtures
- hooks de setup/teardown
- factories e test data builders
- uso de mocks/fakes/stubs
- dependências de serviços externos ou ambientes remotos
- documentação de ambiente de teste, se existir

#### Possíveis Achados
- teste dependente de ordem
- estado compartilhado entre testes
- fixture frágil
- dependência excessiva de ambiente externo
- hermeticidade insuficiente
- setup difícil de reproduzir
- teste que passa localmente e falha em CI por desenho

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- isolamento entre testes
- fragilidade ambiental
- qualidade da base de execução confiável

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao ambiente/configuração de testes
- impossibilidade de inferir dependências externas relevantes
- inconsistência severa entre setup declarado e execução aparente

---

### Fase 3 — Flakiness, Estabilidade e Débito de Teste
#### Objetivo
Avaliar se a suíte fornece sinal estável ou se sofre com flakiness, intermitência, retries mascarando defeitos e baixa confiança operacional.

#### Checks Obrigatórios
- verificar presença de retries e como são usados
- verificar sinais de flaky tests, quarantines, skips frequentes ou suppressions
- verificar se falhas intermitentes parecem conhecidas e tratadas
- verificar se o projeto mede ou ao menos reconhece instabilidade da suíte
- verificar se testes lentos, frágeis ou não determinísticos degradam a confiança no pipeline
- verificar se a base possui débito acumulado de testes quebrados, ignorados ou desativados

#### Evidências Esperadas
- configuração de retries
- testes skipped, flaky, quarantine ou ignore
- histórico de pipeline, quando existir
- relatórios de teste
- traces, screenshots, videos ou artifacts de debug
- comentários e marcações no código de teste

#### Possíveis Achados
- flakiness recorrente
- retry mascarando instabilidade
- suite lenta e pouco confiável
- testes ignorados acumulados
- falha intermitente tratada como "normal"
- perda de confiança do time na suíte
- pipeline com sinal fraco

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- estabilidade real da suíte
- nível de confiança no sinal
- principais fontes de flakiness e débito de teste

#### Condições de Bloqueio da Fase
- ausência de qualquer evidência sobre comportamento da suíte
- impossibilidade de inferir estabilidade mínima
- conflito grave entre configuração de teste e evidência operacional disponível

---

### Fase 4 — Contratos, Integrações e Proteção contra Regressão Cruzada
#### Objetivo
Avaliar se o projeto protege integrações entre componentes ou serviços de forma suficiente para evitar regressões de contrato e incompatibilidades silenciosas.

#### Checks Obrigatórios
- verificar se integrações críticas possuem testes de integração úteis
- verificar se há contract tests quando consumidores e providers justificarem
- verificar se contratos de API, evento ou mensagem são validados de forma automatizada
- verificar se mudanças em provider tendem a quebrar consumidores sem sinal prévio
- verificar se testes de integração exercitam pontos reais de falha, e não apenas caminhos felizes
- verificar se a proteção entre módulos/serviços é proporcional ao risco de regressão cruzada

#### Evidências Esperadas
- testes de integração
- contract tests
- uso de Pact ou abordagem equivalente
- specs OpenAPI ou contratos de mensagem ligados a testes
- pipelines entre consumer/provider quando existirem
- testes de adapters, clients e handlers de integração

#### Possíveis Achados
- integração crítica sem teste
- ausência de contract testing onde seria útil
- contrato não validado automaticamente
- provider quebrando consumidor sem proteção
- integração testada só de forma superficial
- regressão cruzada provável entre serviços/módulos

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- proteção de integrações críticas
- presença ou ausência de verificação de contrato
- risco de regressão entre componentes

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às integrações e seus testes
- impossibilidade de relacionar contrato e verificação automatizada
- inconsistência severa entre integração real e cobertura aparente

---

### Fase 5 — Pipeline, Gates de Qualidade e Readiness para Entrega
#### Objetivo
Avaliar se o pipeline de validação usa a suíte de testes de forma que realmente proteja merge, release e evolução do sistema.

#### Checks Obrigatórios
- verificar se os testes relevantes rodam em CI/CD
- verificar se há gates claros para falha de testes
- verificar se suites lentas ou frágeis comprometem o fluxo de entrega
- verificar se há separação útil entre testes rápidos de feedback e testes mais pesados
- verificar se reports, artifacts e diagnósticos ajudam o time a agir
- verificar se o pipeline parece desenhado para confiança, e não apenas para "ter testes"

#### Evidências Esperadas
- workflows/pipelines
- config de CI
- stages de validação
- critérios de merge/release
- relatórios e artifacts
- organização das suites por propósito ou velocidade

#### Possíveis Achados
- testes não rodando em CI
- gate de qualidade inexistente ou fraco
- pipeline lento demais para feedback útil
- suite crítica fora do fluxo de merge
- artifacts insuficientes para diagnóstico
- separação ruim entre feedback rápido e validação mais pesada
- qualidade de entrega dependente de verificação manual demais

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade do uso da suíte no pipeline
- força dos gates de qualidade
- readiness do projeto para entrega segura

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao pipeline
- impossibilidade de inferir como os testes são executados antes de merge/release
- inconsistência severa entre política declarada e automação observável

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de testes/qualidade de achados cujo núcleo pertença a outro domínio
- destacar lacunas de proteção e perda de confiança no sinal

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre ausência de teste, fragilidade de teste e problema de pipeline

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- lacuna crítica de regressão subavaliada

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
- risco crítico de regressão mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Estratégia de Testes, Portfólio e Cobertura Relevante
2. Isolamento, Hermeticidade e Confiabilidade do Sinal
3. Flakiness, Estabilidade e Débito de Teste
4. Contratos, Integrações e Proteção contra Regressão Cruzada
5. Pipeline, Gates de Qualidade e Readiness para Entrega
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
- conflito grave entre suíte, pipeline e comportamento real de validação

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita estratégia de testes e qualidade de entrega, não qualidade de produto de forma ampla.
- Problemas profundos de arquitetura, segurança, observabilidade, performance ou infraestrutura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente a capacidade de testar, isolar ou entregar com confiança, ele pode ser citado aqui como impacto em testes/qualidade, sem substituir a auditoria específica daquele domínio.
