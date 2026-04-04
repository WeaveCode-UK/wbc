# Playbook do Domínio: performance-escalabilidade

## Identificação
- dominio: performance-escalabilidade
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o sistema atende requisitos de desempenho de forma eficiente hoje e se a sua estrutura técnica permite sustentar crescimento de carga, volume de dados, concorrência e complexidade operacional sem degradação descontrolada.

## Aplicabilidade
Este playbook se aplica a qualquer projeto com execução real, especialmente quando houver:
- backend
- API
- frontend web
- jobs assíncronos
- workers
- banco de dados
- filas
- cache
- integrações externas
- múltiplos serviços ou módulos relevantes
- tráfego variável ou crescimento esperado

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto ainda não possui runtime executável real
- não há carga, usuários, chamadas ou persistência relevantes no escopo
- certas métricas, como Web Vitals, não fizerem sentido para o tipo de sistema auditado
- o sistema for apenas uma biblioteca local sem runtime operacional próprio

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara dos principais gargalos atuais ou potenciais
- avaliação de eficiência de processamento, dados, rede, renderização e consumo de recursos
- avaliação de mecanismos de cache, filas, paralelismo e proteção contra overload quando aplicáveis
- avaliação de readiness para crescimento e comportamento sob aumento de demanda
- consolidação dos riscos prioritários de performance e escalabilidade
- recomendações práticas priorizadas

## Referencial Base do Playbook
Este playbook usa como baseline:
- abordagem orientada por dados para performance
- eficiência de uso de recursos para atender requisitos
- escalabilidade sustentada por seleção arquitetural e operacional coerente
- proteção contra overload e degradação não controlada
- métricas centradas no usuário quando houver interface web

## Escopo Padrão da Run
- requisitos e sinais de performance existentes
- gargalos de CPU, memória, I/O, rede ou renderização
- latência, throughput, concorrência e volume
- acesso a dados e queries
- serialização, payloads e processamento
- cache, filas, batching, paralelismo e backpressure
- comportamento sob overload e crescimento
- readiness para escalar horizontal ou verticalmente
- métricas de experiência do usuário, quando aplicável

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com performance e escalabilidade.
- Não expandir para segurança, UX ou arquitetura detalhada, salvo quando houver impacto direto em performance.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar gargalos reais ou riscos plausíveis de degradação importante.
- Diferenciar claramente:
  - gargalo confirmado
  - ineficiência evidente
  - risco de escalabilidade
  - hipótese que ainda depende de medição futura

## Fases Oficiais da Run

### Fase 1 — Sinais de Performance, Requisitos e Hotspots Iniciais
#### Objetivo
Entender como o sistema mede performance, quais sinais existem e onde estão os principais hotspots, caminhos críticos e áreas de maior sensibilidade a carga.

#### Checks Obrigatórios
- identificar métricas, sinais ou evidências de performance já existentes
- identificar requisitos explícitos ou implícitos de latência, throughput, concorrência ou tempo de resposta
- mapear endpoints, jobs, fluxos ou telas críticas
- identificar caminhos síncronos e assíncronos relevantes
- identificar operações potencialmente custosas em CPU, memória, rede, disco, renderização ou serialização
- identificar se existe distinção entre desempenho percebido pelo usuário e desempenho interno do sistema

#### Evidências Esperadas
- documentação técnica, SLOs, SLIs, dashboards, logs, traces ou medições existentes
- endpoints críticos
- jobs, workers ou pipelines relevantes
- fluxos frontend relevantes
- métricas de runtime, quando existirem
- referências a carga, volume ou gargalos já conhecidos

#### Possíveis Achados
- ausência de sinais mínimos de performance
- caminho crítico não identificado
- requisito de latência não explicitado
- hotspots importantes sem medição
- sistema sensível a carga sem visibilidade suficiente
- confusão entre desempenho interno e experiência real do usuário

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- onde estão os fluxos críticos
- quais sinais de performance existem
- quais áreas exigem verificação aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase
- impossibilidade de identificar fluxos críticos
- ausência total de evidência mínima sobre comportamento do sistema
- inconsistência severa que impeça localizar hotspots iniciais

---

### Fase 2 — Dados, Processamento e Eficiência de Recursos
#### Objetivo
Avaliar se o sistema processa dados e consome recursos de forma eficiente, especialmente em pontos críticos de leitura, escrita, serialização, cálculo e movimentação de dados.

#### Checks Obrigatórios
- verificar queries, acesso a dados e padrões evidentes de ineficiência
- verificar risco de N+1, fan-out excessivo ou chamadas redundantes
- verificar payloads excessivos, overfetching ou serialização custosa
- verificar loops, processamento repetitivo, parsing excessivo ou transformações caras
- verificar uso de CPU, memória ou I/O de forma evidentemente ineficiente
- verificar se a arquitetura de dados ajuda ou atrapalha o desempenho esperado
- verificar se operações críticas podem crescer de forma explosiva com o volume

#### Evidências Esperadas
- código de acesso a dados
- queries, repositórios, ORMs, builders ou pipelines
- traces, logs ou métricas de latência quando existirem
- payloads de API, contratos, responses e serializers
- jobs e processos intensivos
- pontos de agregação, fan-out e composição de resposta

#### Possíveis Achados
- query ineficiente
- N+1
- payload excessivo
- processamento redundante
- custo excessivo por requisição
- acesso desnecessário a banco ou rede
- transformação cara em caminho quente
- crescimento ruim com volume de dados

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- eficiência do acesso a dados
- eficiência do processamento
- principais custos técnicos por caminho crítico

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às camadas que fazem processamento ou acesso a dados
- impossibilidade de relacionar operação crítica ao código correspondente
- inconsistência severa entre caminho lógico e execução real observável

---

### Fase 3 — Cache, Paralelismo, Filas e Controle de Carga
#### Objetivo
Avaliar se o sistema usa mecanismos adequados para reduzir custo por operação, amortecer picos e sustentar crescimento de demanda com controle razoável de carga.

#### Checks Obrigatórios
- verificar uso de cache onde ele faria sentido
- verificar invalidação, coerência e granularidade de cache quando aplicável
- verificar batching, pooling, connection reuse ou mecanismos equivalentes
- verificar uso de filas, workers ou processamento assíncrono quando apropriado
- verificar paralelismo e concorrência onde houver benefício real
- verificar existência de backpressure, throttling, rate control ou mecanismos equivalentes
- verificar se o sistema tem sinais de degradação graciosa ou proteção contra overload
- verificar gargalos centralizados que limitem escalabilidade

#### Evidências Esperadas
- configs e código de cache
- filas, brokers, workers e jobs
- controle de concorrência, pooling e connection management
- configuração de timeouts, retries ou throttling quando impactarem performance
- traces e métricas de throughput
- desenho de fluxos síncronos vs assíncronos

#### Possíveis Achados
- ausência de cache onde seria esperado
- cache mal posicionado ou inconsistente
- falta de desacoplamento assíncrono em fluxo pesado
- fila sem estratégia adequada
- concorrência subutilizada ou perigosa
- falta de backpressure
- sistema sujeito a overload sem degradação controlada
- gargalo central limitando escala

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- uso adequado ou inadequado de cache e filas
- capacidade do sistema de amortecer carga
- riscos principais de escalabilidade sob aumento de demanda

#### Condições de Bloqueio da Fase
- ausência de acesso à configuração ou implementação de mecanismos de carga relevantes
- incapacidade de inferir comportamento de cache/filas/concurrency
- conflito grave entre desenho declarado e runtime observado

---

### Fase 4 — Frontend, Rede e Experiência Percebida
#### Objetivo
Avaliar o desempenho percebido pelo usuário quando houver interface web ou cliente equivalente, além de impactos de rede e entrega de recursos.

#### Checks Obrigatórios
- verificar métricas user-centric aplicáveis, como FCP, INP, TTFB ou outras medições equivalentes
- verificar renderização, custo de JavaScript, hidratação e responsividade quando aplicável
- verificar tamanho e estratégia de carregamento de recursos
- verificar latência de rede, compressão, CDN, caching de assets e entrega de conteúdo quando aplicável
- verificar se a experiência percebida é compatível com a performance interna observada
- verificar shifts, jank, bloqueios de main thread ou gargalos equivalentes quando aplicável

#### Evidências Esperadas
- métricas web ou client-side
- recursos carregados e estratégia de loading
- traces e logs de frontend, se existirem
- configuração de CDN, cache-control, compressão ou delivery
- resultados de tooling de medição quando existirem
- evidências de responsividade percebida

#### Possíveis Achados
- TTFB ruim
- FCP lento
- INP ruim
- recurso grande demais
- bundle excessivo
- renderização cara
- hidratação pesada
- cache de asset ineficiente
- experiência percebida pior do que o backend sugere

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- desempenho percebido pelo usuário
- principais gargalos de frontend/rede
- relação entre experiência percebida e comportamento técnico

#### Condições de Bloqueio da Fase
- ausência de frontend ou cliente aplicável no escopo
- impossibilidade de acessar qualquer evidência mínima de runtime do cliente
- inconsistência severa que impeça distinguir gargalos de frontend/rede

---

### Fase 5 — Escalabilidade, Capacity Readiness e Overload
#### Objetivo
Avaliar se o sistema está preparado para crescer de forma controlada e como ele tende a se comportar sob carga elevada, concorrência crescente ou aumento de volume.

#### Checks Obrigatórios
- verificar se os principais gargalos escalam linearmente, sublinearmente ou de forma ruim
- verificar pontos únicos de saturação
- verificar readiness para scale-up, scale-out ou particionamento quando aplicável
- verificar se o sistema possui mecanismos claros para lidar com overload
- verificar se SLOs, SLIs ou metas de desempenho existem e se ajudam na tomada de decisão
- verificar riscos de cascata, contenção ou degradação brusca sob carga
- verificar se há sinais de capacity planning, limites conhecidos ou margens operacionais mínimas
- verificar se a arquitetura atual favorece ou dificulta crescimento futuro

#### Evidências Esperadas
- métricas de throughput, latência, saturação e erro, quando existirem
- dashboards, capacity notes, documentação técnica ou runbooks
- mecanismos de autoscaling, particionamento, filas, balanceamento ou distribuição de carga
- evidências de limites conhecidos ou gargalos previstos
- traces e sinais de degradação sob carga quando existirem

#### Possíveis Achados
- ausência de estratégia de crescimento
- gargalo único não mitigado
- overload sem resposta controlada
- risco de cascata
- SLO ausente ou irrelevante
- falta de margem operacional conhecida
- escalabilidade ruim por desenho estrutural
- crescimento dependente de intervenção manual excessiva

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- readiness do sistema para crescer
- comportamento provável sob aumento de demanda
- riscos prioritários de saturação e degradação

#### Condições de Bloqueio da Fase
- falta de evidência mínima para inferir comportamento sob carga
- ausência total de sinais operacionais em sistema que claramente deveria tê-los
- conflito grave entre desenho, medição e comportamento esperado

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de performance/escalabilidade de achados cujo núcleo pertença a outro domínio
- destacar gargalos e riscos de crescimento prioritários

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre gargalo confirmado, risco de escala e hipótese

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- gargalo crítico subavaliado

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
- confirmar gargalos prioritários
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
- risco de escalabilidade mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Sinais de Performance, Requisitos e Hotspots Iniciais
2. Dados, Processamento e Eficiência de Recursos
3. Cache, Paralelismo, Filas e Controle de Carga
4. Frontend, Rede e Experiência Percebida
5. Escalabilidade, Capacity Readiness e Overload
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
- conflito grave entre medição, documentação e comportamento técnico observado

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita performance e escalabilidade como capacidade técnica e operacional.
- Problemas profundos de arquitetura, observabilidade, confiabilidade, UX ou infraestrutura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente throughput, latência, saturação, renderização ou capacidade de crescimento, ele pode ser citado aqui como impacto de performance, sem substituir a auditoria específica daquele domínio.
