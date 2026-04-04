# Prompt 01B — Seed Playbooks do Framework de Auditoria (v2 — Autossuficiente)

Você é um agente local operando diretamente no repositório.

Sua tarefa nesta execução é **somente** materializar o catálogo de playbooks e os **11 playbooks canônicos** do framework de auditoria já inicializado pelo **Prompt 01A — Bootstrap Core**.

# Objetivo

Popular, dentro de `/Auditoria/_framework/playbooks/`, os seguintes arquivos com o conteúdo canônico completo definido neste prompt:

- `index.md`
- `arquitetura.playbook.md`
- `codigo-manutenibilidade.playbook.md`
- `seguranca.playbook.md`
- `apis-integracoes.playbook.md`
- `dados-persistencia.playbook.md`
- `performance-escalabilidade.playbook.md`
- `confiabilidade-resiliencia.playbook.md`
- `observabilidade-operacao.playbook.md`
- `testes-qualidade.playbook.md`
- `ui-ux-fluxos.playbook.md`
- `infraestrutura-deploy-config.playbook.md`

Além disso, esta execução deve:
- atualizar `/Auditoria/_framework/playbook-seed-report.md`
- atualizar `/Auditoria/_framework/status-geral.md`
- atualizar `/Auditoria/_framework/checklist-global.md` somente nos itens compatíveis com a semeadura dos playbooks
- encerrar

# Regra máxima desta execução

Esta execução é **exclusivamente de Seed Playbooks**.

Você deve:
1. validar que o Bootstrap Core já existe
2. validar a estrutura mínima do framework
3. criar a pasta `/Auditoria/_framework/playbooks/` se ela ainda não existir
4. criar ou completar o catálogo de playbooks usando o conteúdo canônico deste prompt
5. criar ou completar os 11 playbooks canônicos usando o conteúdo canônico deste prompt
6. registrar o resultado em `/Auditoria/_framework/playbook-seed-report.md`
7. atualizar `/Auditoria/_framework/status-geral.md`
8. encerrar

Você **não deve**:
- executar auditoria de nenhum domínio
- iniciar run
- finalizar run
- alterar arquivos fora de `/Auditoria`
- modificar código-fonte do projeto auditado
- alterar testes da aplicação
- alterar infraestrutura da aplicação
- gerar achados técnicos do projeto
- sobrescrever runs históricas
- inventar novos domínios
- inventar playbooks adicionais fora dos 11 oficiais
- resumir ou empobrecer o conteúdo canônico dos playbooks

# Modo de escrita permitido

Você pode escrever **somente** dentro de:
- `/Auditoria/_framework/playbooks/`
- `/Auditoria/_framework/playbook-seed-report.md`
- `/Auditoria/_framework/status-geral.md`
- `/Auditoria/_framework/checklist-global.md` (apenas se houver itens explícitos de seed/playbooks)

Fora disso, este prompt opera em modo **somente leitura**.

# Pré-condições obrigatórias

Antes de qualquer escrita, valide a existência e a compatibilidade mínima dos seguintes caminhos:

- `/Auditoria`
- `/Auditoria/_framework`
- `/Auditoria/_framework/framework.md`
- `/Auditoria/_framework/convencoes.md`
- `/Auditoria/_framework/lifecycle.md`
- `/Auditoria/_framework/domains.md`
- `/Auditoria/_framework/execution-rules.md`
- `/Auditoria/_framework/state-machine.md`
- `/Auditoria/_framework/glossario.md`
- `/Auditoria/_framework/checklist-global.md`
- `/Auditoria/_framework/status-geral.md`
- `/Auditoria/_framework/bootstrap-report.md`
- `/Auditoria/_framework/templates/`

Se qualquer um desses itens obrigatórios não existir, **aborte sem improvisar**. O Bootstrap Core deve ser executado primeiro.

# Regra de falha segura

Se o core do framework não existir de forma compatível:
1. não crie estrutura paralela
2. não tente reconstruir o Bootstrap Core
3. registre a falha em `/Auditoria/_framework/playbook-seed-report.md` somente se esse arquivo já existir
4. caso contrário, encerre sem alterar arquivos

# Regra de idempotência

Se o seed já tiver sido executado total ou parcialmente:
- preserve arquivos compatíveis já existentes
- complete apenas o que faltar usando o conteúdo canônico deste prompt
- não rebaixe qualidade nem apague conteúdo canônico válido
- não duplique arquivos
- se um playbook existir mas estiver incompleto, complete-o com o conteúdo canônico deste prompt
- se um playbook existir com conflito estrutural, registre o conflito e não improvise substituição silenciosa

# Regra de conteúdo — CRÍTICA

O conteúdo de cada playbook está definido neste prompt, nas seções abaixo.

Você **deve** usar exatamente esse conteúdo, preservando:
- todos os headings
- a ordem exata das seções
- a ordem exata das fases
- todos os checks obrigatórios
- todos os critérios de conclusão
- todas as condições de bloqueio
- todas as regras de execução
- todos os critérios de `ready_for_finalize`
- todas as observações finais

**Não resuma.**
**Não abrevia.**
**Não reordene.**
**Não omita seções.**

---

# Catálogo oficial de playbooks — index.md

Crie `/Auditoria/_framework/playbooks/index.md` com o seguinte conteúdo:

```markdown
# Índice Oficial de Playbooks do Framework de Auditoria

## Objetivo
Este índice lista os playbooks oficiais do framework e define qual playbook deve ser usado ao iniciar uma run de auditoria por domínio.

## Regra de Seleção
O Prompt 02 — Iniciar Run deve:
1. apresentar os domínios oficiais disponíveis;
2. receber a escolha de um único domínio;
3. validar se o domínio escolhido existe neste índice;
4. localizar o playbook correspondente;
5. inicializar a run com base nesse playbook.

## Domínios Oficiais e Playbooks

1. arquitetura
   - arquivo: `/Auditoria/_framework/playbooks/arquitetura.playbook.md`
   - foco: aderência entre arquitetura declarada e implementada

2. codigo-manutenibilidade
   - arquivo: `/Auditoria/_framework/playbooks/codigo-manutenibilidade.playbook.md`
   - foco: saúde evolutiva do código

3. seguranca
   - arquivo: `/Auditoria/_framework/playbooks/seguranca.playbook.md`
   - foco: riscos de exploração, exposição e proteção

4. apis-integracoes
   - arquivo: `/Auditoria/_framework/playbooks/apis-integracoes.playbook.md`
   - foco: contratos, rotas, webhooks e robustez de integração

5. dados-persistencia
   - arquivo: `/Auditoria/_framework/playbooks/dados-persistencia.playbook.md`
   - foco: modelagem, integridade e operação da camada de dados

6. performance-escalabilidade
   - arquivo: `/Auditoria/_framework/playbooks/performance-escalabilidade.playbook.md`
   - foco: eficiência, gargalos e capacidade de crescimento

7. confiabilidade-resiliencia
   - arquivo: `/Auditoria/_framework/playbooks/confiabilidade-resiliencia.playbook.md`
   - foco: comportamento sob falha, recuperação e robustez operacional

8. observabilidade-operacao
   - arquivo: `/Auditoria/_framework/playbooks/observabilidade-operacao.playbook.md`
   - foco: logs, métricas, traces, health checks e diagnóstico

9. testes-qualidade
   - arquivo: `/Auditoria/_framework/playbooks/testes-qualidade.playbook.md`
   - foco: prevenção de regressão e robustez da validação automatizada

10. ui-ux-fluxos
    - arquivo: `/Auditoria/_framework/playbooks/ui-ux-fluxos.playbook.md`
    - foco: integridade funcional da interface e qualidade de fluxo

11. infraestrutura-deploy-config
    - arquivo: `/Auditoria/_framework/playbooks/infraestrutura-deploy-config.playbook.md`
    - foco: prontidão operacional, configuração e entrega

## Regras Operacionais dos Playbooks
- Cada run deve usar apenas um playbook por vez.
- O playbook selecionado define objetivo, escopo, fases internas, checks obrigatórios, critérios de bloqueio e critérios de `ready_for_finalize`.
- O Prompt 03 — Executar Run deve executar somente o playbook da run atualmente aberta.
- O Prompt 04 — Finalizar Run deve fechar somente a run atualmente aberta.

## Resultado Esperado
O framework deve permitir que o usuário:
1. escolha um domínio;
2. abra a run com base no playbook desse domínio;
3. execute a auditoria desse domínio;
4. finalize e arquive essa run;
5. depois inicie outra run, de outro domínio, se desejar.
```

---

# Conteúdo canônico dos 11 playbooks

As seções abaixo definem o conteúdo exato de cada playbook. Crie cada arquivo em `/Auditoria/_framework/playbooks/` com exatamente esse conteúdo.


---

## Playbook: `arquitetura.playbook.md`

Crie `/Auditoria/_framework/playbooks/arquitetura.playbook.md` com o seguinte conteúdo:

```markdown
# Playbook do Domínio: arquitetura

## Identificação
- dominio: arquitetura
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se a arquitetura declarada do sistema está claramente definida, documentada de forma útil e realmente refletida na implementação do projeto.

## Aplicabilidade
Este playbook se aplica a qualquer projeto de software com código-fonte executável, incluindo:
- monólitos
- modular monoliths
- microsserviços
- aplicações full stack
- APIs
- apps com frontend e backend
- sistemas legados em evolução

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto for extremamente pequeno e não houver separação estrutural relevante
- não houver documentação arquitetural explícita e a auditoria precisar se apoiar apenas no código e na estrutura real
- níveis mais profundos de decomposição não fizerem sentido para o estágio atual do projeto

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara da arquitetura declarada e da arquitetura real
- identificação de aderência ou divergência entre intenção e implementação
- identificação de boundaries, responsabilidades e dependências
- avaliação da sustentação arquitetural para qualidades relevantes do sistema
- consolidação de riscos arquiteturais prioritários
- recomendações práticas para correção ou evolução

## Referencial Base do Playbook
Este playbook usa como baseline:
- descrição arquitetural com viewpoints e estrutura coerente
- leitura hierárquica da solução em níveis de contexto, containers e componentes
- verificação de decisões arquiteturais significativas e seus registros
- avaliação arquitetural orientada a qualidades operacionais relevantes

## Escopo Padrão da Run
- arquitetura declarada vs implementada
- contexto do sistema
- decomposition estrutural
- boundaries entre módulos, camadas, containers ou serviços
- direção de dependências
- contratos e pontos de integração relevantes
- decisões arquiteturais significativas
- aderência da arquitetura às qualidades esperadas do sistema
- riscos estruturais para evolução, operação e escalabilidade

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com arquitetura.
- Não expandir para segurança detalhada, testes detalhados ou observabilidade detalhada, salvo quando isso impactar diretamente a arquitetura.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Não confundir decisão de implementação local com decisão arquitetural relevante.
- Priorizar problemas estruturais que alteram manutenção, evolução, deploy, acoplamento ou confiabilidade do sistema.

## Fases Oficiais da Run

### Fase 1 — Arquitetura Declarada, Contexto e Escopo
#### Objetivo
Entender qual arquitetura o projeto afirma usar, qual é o escopo do sistema e como ele se posiciona em relação a usuários, sistemas externos, stores, filas, bancos e ambientes relevantes.

#### Checks Obrigatórios
- localizar documentação arquitetural explícita, se existir
- identificar padrão arquitetural declarado ou predominante
- identificar escopo do sistema auditado
- mapear atores, sistemas externos e dependências relevantes
- verificar se existe visão de contexto minimamente clara
- verificar se a nomenclatura estrutural usada no projeto é consistente

#### Evidências Esperadas
- README, docs, ADRs ou documentação técnica
- estrutura de pastas e módulos
- arquivos de configuração, compose, manifests, infra ou deployment quando relevantes
- diagramas existentes, se houver
- referências a bounded contexts, módulos, services, apps ou packages

#### Possíveis Achados
- arquitetura declarada ausente
- arquitetura declarada vaga ou contraditória
- contexto do sistema mal definido
- fronteira do sistema confusa
- dependências externas críticas não explicitadas
- nomenclatura estrutural inconsistente

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- qual arquitetura o projeto declara ou aparenta usar
- qual é o escopo do sistema auditado
- quais são os principais elementos externos e internos relevantes para a leitura arquitetural

#### Condições de Bloqueio da Fase
- impossibilidade de identificar o sistema em escopo
- estrutura do projeto tão inconsistente que impeça leitura mínima
- ausência total de evidência suficiente para mapear contexto e decomposição inicial

---

### Fase 2 — Decomposição Estrutural, Boundaries e Dependências
#### Objetivo
Verificar se a arquitetura real está organizada de forma coerente em módulos, camadas, containers, componentes ou serviços, e se as dependências respeitam as boundaries esperadas.

#### Checks Obrigatórios
- identificar unidades arquiteturais relevantes do projeto
- verificar distribuição de responsabilidades entre essas unidades
- verificar se há acoplamento excessivo
- verificar se há dependências cruzadas indevidas
- verificar se a direção de dependências é coerente com o padrão declarado
- verificar se interfaces, adapters, controllers, services, repositories, modules ou packages estão cumprindo papéis coerentes
- verificar se a decomposição escolhida parece sustentada pela implementação real

#### Evidências Esperadas
- árvore de diretórios
- imports/dependências entre módulos
- composição de apps/packages/modules/services
- wiring de containers, DI, factories, bootstrap ou composition root
- código de fronteira entre camadas e módulos
- contratos internos relevantes

#### Possíveis Achados
- violação de arquitetura declarada
- boundaries fracos ou inexistentes
- dependência invertida de forma indevida
- mistura de responsabilidades
- módulos sem coesão
- acoplamento excessivo entre camadas
- lógica de domínio espalhada por camadas de transporte ou infraestrutura
- serviços ou packages com responsabilidade difusa

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- como o sistema está decomposto
- se as boundaries são reais ou apenas nominais
- se a direção das dependências sustenta ou viola a arquitetura pretendida

#### Condições de Bloqueio da Fase
- estrutura do projeto impede identificar unidades relevantes
- ausência de acesso suficiente ao código que forma as fronteiras
- inconsistência severa entre artefatos estruturais e implementação real

---

### Fase 3 — Decisões Arquiteturais e Sustentação das Qualidades do Sistema
#### Objetivo
Avaliar se a arquitetura possui decisões significativas reconhecíveis, se essas decisões estão registradas ou inferíveis, e se a estrutura atual sustenta qualidades operacionais e evolutivas relevantes.

#### Checks Obrigatórios
- identificar decisões arquiteturais significativas explícitas ou implícitas
- verificar se decisões importantes possuem registro, contexto ou justificativa
- avaliar como a arquitetura favorece ou prejudica:
  - operabilidade
  - confiabilidade
  - performance
  - escalabilidade
  - segurança estrutural
  - custo de mudança
- verificar separação de preocupações cross-cutting em nível arquitetural
- verificar implicações arquiteturais de deploy, runtime, comunicação síncrona/assíncrona, bancos e stores relevantes
- verificar existência de pontos únicos de falha ou centralizações excessivas em nível estrutural
- verificar se a arquitetura parece sustentável para evolução futura

#### Evidências Esperadas
- ADRs ou documentação equivalente
- código de bootstrap/composição
- diagramas de deployment ou indícios claros de runtime topology
- configuração de filas, brokers, caches, bancos, workers ou processos de background quando existirem
- políticas estruturais explícitas em docs ou conventions
- organização real do sistema em execução

#### Possíveis Achados
- decisão arquitetural significativa sem registro
- trade-off importante não explicitado
- arquitetura que não sustenta as qualidades esperadas do sistema
- ponto único de falha estrutural
- centralização excessiva
- runtime topology incoerente com o desenho declarado
- arquitetura difícil de evoluir sem alto custo de mudança
- padrão arquitetural usado apenas como nomenclatura, sem enforcement real

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais decisões arquiteturais relevantes existem
- quais riscos estruturais elas introduzem
- se a arquitetura sustenta ou compromete as qualidades mais importantes do sistema

#### Condições de Bloqueio da Fase
- ausência total de evidência para inferir decisões estruturais relevantes
- incapacidade de relacionar componentes estruturais ao comportamento real do sistema
- conflito grave entre documentação e implementação sem base suficiente para resolver a leitura

---

### Fase 4 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente arquiteturais de achados que pertencem a outros domínios

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- separação clara entre problema estrutural e problema incidental

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- achado registrado no domínio errado
- resumo arquitetural incompleto

#### Critério de Conclusão da Fase
Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e claramente classificados como arquiteturais.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run

---

### Fase 5 — Preparação para Finalização
#### Objetivo
Preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios
- revisar escopo executado
- revisar escopo não coberto
- preencher `relatorio-final.md`
- confirmar riscos arquiteturais prioritários
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
- escopo crítico não tratado

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- escopo crítico não tratado sem justificativa
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Arquitetura Declarada, Contexto e Escopo
2. Decomposição Estrutural, Boundaries e Dependências
3. Decisões Arquiteturais e Sustentação das Qualidades do Sistema
4. Consolidação de Achados
5. Preparação para Finalização

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
- conflito grave entre documentação e implementação sem base suficiente para conclusão

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita arquitetura como disciplina estrutural.
- Problemas profundos de segurança, performance, testes, observabilidade ou deploy devem ser registrados nesses domínios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente a arquitetura, ele pode ser citado aqui como impacto arquitetural, sem substituir a auditoria específica daquele domínio.

```


---

## Playbook: `codigo-manutenibilidade.playbook.md`

Crie `/Auditoria/_framework/playbooks/codigo-manutenibilidade.playbook.md` com o seguinte conteúdo:

```markdown
# Playbook do Domínio: codigo-manutenibilidade

## Identificação
- dominio: codigo-manutenibilidade
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o código do sistema está organizado de forma que possa ser compreendido, modificado, testado e evoluído com custo razoável, sem introduzir atrito excessivo, regressões frequentes ou dependência desproporcional de conhecimento tácito.

## Aplicabilidade
Este playbook se aplica a qualquer projeto com código-fonte relevante, incluindo:
- monólitos
- modular monoliths
- microsserviços
- aplicações full stack
- APIs
- apps com frontend e backend
- sistemas legados em evolução
- bibliotecas internas com papel relevante no ecossistema

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto for extremamente pequeno e a estrutura ainda for intencionalmente mínima
- não houver código suficiente para inferir padrões de manutenção
- certos mecanismos, como linting, static analysis ou convenções automatizadas, não existirem ainda por estágio muito inicial do projeto

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara da saúde evolutiva do código
- identificação de áreas com alta dificuldade de leitura, análise e mudança
- avaliação de modularidade, coesão, acoplamento, convenções e consistência interna
- identificação de code smells, complexidade excessiva, duplicação e fragilidades estruturais de manutenção
- consolidação dos riscos prioritários para evolução do sistema
- recomendações práticas priorizadas

## Referencial Base do Playbook
Este playbook usa como baseline:
- maintainability como qualidade do produto de software
- modularidade, analisabilidade, modificabilidade e testabilidade como pilares de manutenção
- code smells como sinais de problemas mais profundos
- refactoring como técnica disciplinada de melhoria estrutural
- complexidade cognitiva como indicador de dificuldade real de entendimento

## Escopo Padrão da Run
- organização do código
- convenções e consistência interna
- modularidade e boundaries locais
- complexidade de leitura e fluxo
- code smells e duplicação
- coesão e acoplamento
- clareza de nomes e responsabilidades
- facilidade de modificação
- apoio à testabilidade e evolução
- pontos de dívida técnica estrutural

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com código e manutenibilidade.
- Não expandir para arquitetura macro, segurança ou performance detalhada, salvo quando houver impacto direto na saúde evolutiva do código.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar problemas que tornam o código difícil de entender, alterar, testar ou estabilizar.
- Diferenciar claramente:
  - estilo local discutível
  - smell recorrente
  - fragilidade de manutenção
  - obstáculo estrutural à evolução

## Fases Oficiais da Run

### Fase 1 — Estrutura Local, Convenções e Legibilidade
#### Objetivo
Avaliar se o código apresenta estrutura legível, convenções consistentes e organização interna minimamente previsível para manutenção cotidiana.

#### Checks Obrigatórios
- verificar consistência de nomenclatura de arquivos, módulos, classes, funções e variáveis
- verificar se responsabilidades locais parecem claras
- verificar se a organização por pastas, módulos ou packages ajuda ou atrapalha o entendimento
- verificar se convenções de estilo e organização parecem coerentes ao longo do projeto
- verificar se comentários existem onde agregam contexto, sem mascarar código ruim
- verificar se o código depende excessivamente de conhecimento implícito

#### Evidências Esperadas
- árvore de diretórios
- nomes de arquivos e módulos
- assinaturas de funções e classes
- estrutura de arquivos representativos
- convenções explícitas ou implícitas no repositório
- comentários e documentação de código quando existirem

#### Possíveis Achados
- nomenclatura inconsistente
- responsabilidades pouco claras
- organização local confusa
- código difícil de navegar
- comentários compensando falta de clareza estrutural
- convenções inexistentes ou contraditórias

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- consistência estrutural básica do código
- qualidade de legibilidade
- previsibilidade da organização local

#### Condições de Bloqueio da Fase
- estrutura do projeto tão inconsistente que impeça leitura mínima
- ausência de acesso suficiente ao código representativo
- mistura severa de artefatos que inviabilize inferência razoável de convenções

---

### Fase 2 — Complexidade, Code Smells e Duplicação
#### Objetivo
Avaliar se o código apresenta complexidade excessiva, smells recorrentes ou duplicação que aumentem o custo de entendimento e mudança.

#### Checks Obrigatórios
- verificar funções, métodos ou arquivos excessivamente longos ou densos
- verificar nesting excessivo, fluxo de controle difícil e complexidade cognitiva elevada quando visível
- verificar duplicação estrutural ou lógica significativa
- verificar code smells recorrentes, como responsabilidades inchadas, lógica espalhada, shotgun surgery, conditional complexity ou acoplamento local excessivo
- verificar uso de abstrações prematuras ou indireção excessiva que piorem a leitura
- verificar presença de trechos frágeis, mágicos ou pouco explicáveis

#### Evidências Esperadas
- funções e módulos representativos
- branches, loops, condicionais e exceções aninhadas
- repetições visíveis entre arquivos ou funções
- sinais de complexidade de entendimento
- regras de static analysis, se existirem
- hotspots já conhecidos no time ou na base

#### Possíveis Achados
- complexidade cognitiva alta em caminhos importantes
- duplicação relevante
- função ou classe inchada
- indireção desnecessária
- conditional spaghetti
- smell recorrente sem tratamento
- código frágil ou "mágico"
- alto custo de entendimento para mudança simples

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- pontos de maior complexidade
- smells relevantes
- impacto da duplicação e do fluxo no custo de manutenção

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às áreas críticas do código
- impossibilidade de analisar trechos representativos
- inconsistência severa entre estrutura visível e comportamento inferido

---

### Fase 3 — Modularidade, Coesão, Acoplamento e Modificabilidade
#### Objetivo
Avaliar se o código está dividido de forma que mudanças possam ser feitas com impacto controlado, baixo espalhamento e risco razoável.

#### Checks Obrigatórios
- verificar se módulos, classes ou componentes têm coesão razoável
- verificar se mudanças simples tenderiam a exigir alteração em muitos lugares
- verificar acoplamento excessivo entre partes que deveriam variar separadamente
- verificar dependências ocultas, globais ou difíceis de rastrear
- verificar se abstrações ajudam a modificação ou apenas escondem complexidade
- verificar se o desenho local favorece modificabilidade e reuso
- verificar se boundaries internos ajudam a limitar impacto de mudança

#### Evidências Esperadas
- imports e dependências entre módulos
- chamadas cruzadas relevantes
- uso de singletons, globals, shared state ou utilitários centrais
- histórico estrutural do código, se visível
- áreas onde mudanças costumam se espalhar
- pontos de extensão e interfaces internas

#### Possíveis Achados
- baixa coesão
- alto acoplamento
- mudança simples com alto espalhamento
- dependência oculta
- abstração que dificulta alteração
- módulo difícil de modificar sem quebrar outros
- boundary local fraco
- reuso artificial ou forçado

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- capacidade do código de absorver mudanças
- impacto estrutural de modificação
- pontos onde a manutenção tende a ficar cara ou arriscada

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às relações entre módulos
- impossibilidade de inferir dependências significativas
- inconsistência grave entre estrutura local e uso real do código

---

### Fase 4 — Testabilidade, Analisabilidade e Apoio à Evolução
#### Objetivo
Avaliar se o código facilita análise, isolamento, teste e refactoring seguro ao longo do tempo.

#### Checks Obrigatórios
- verificar se o desenho local favorece testes ou isolamento razoável
- verificar se dependências são injetáveis, substituíveis ou controláveis quando necessário
- verificar se side effects estão claros
- verificar se o código é analisável sem rastreamento excessivo
- verificar se mudanças pequenas parecem seguras de realizar com baixo risco oculto
- verificar se a estrutura atual favorece refactoring incremental
- verificar se o código está preso a acoplamentos que inviabilizam melhoria gradual

#### Evidências Esperadas
- testes existentes, se houver
- construção de objetos e dependências
- uso de I/O, rede, banco, filesystem e side effects
- funções puras ou impuras
- factories, injection, wiring local
- zonas do código sabidamente frágeis para mudança

#### Possíveis Achados
- código difícil de testar
- side effects ocultos
- dependência rígida
- analisabilidade baixa
- refactoring perigoso ou caro
- baixa isolabilidade
- necessidade de setup excessivo para validar mudança
- evolução local travada por acoplamento

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- testabilidade prática do código
- facilidade de análise
- prontidão para melhoria incremental segura

#### Condições de Bloqueio da Fase
- falta de acesso suficiente aos pontos de integração e side effects
- impossibilidade de inferir comportamento local relevante
- inconsistência grave que impeça avaliar suporte à evolução

---

### Fase 5 — Dívida Técnica Estrutural e Priorização de Correção
#### Objetivo
Avaliar quais problemas de manutenibilidade representam dívida técnica estrutural relevante e quais devem ser priorizados para correção.

#### Checks Obrigatórios
- verificar se os problemas encontrados são localizados ou sistêmicos
- verificar impacto provável em custo de manutenção futura
- verificar se existem hotspots que concentram risco de mudança
- verificar se a dívida técnica afeta velocidade, estabilidade ou onboarding
- verificar se há sinais de deterioração contínua sem contenção
- verificar se a priorização de correção pode ser feita de forma pragmática

#### Evidências Esperadas
- concentração de smells
- áreas críticas difíceis de alterar
- módulos com alto atrito recorrente
- duplicação sistêmica
- hotspots de complexidade
- pontos onde refactoring incremental parece mais urgente

#### Possíveis Achados
- dívida técnica estrutural alta
- hotspot de manutenção
- degradação contínua da base
- custo de mudança desproporcional
- baixa previsibilidade de alteração
- necessidade de refactoring prioritário
- risco de desaceleração contínua do time

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- principais dívidas técnicas estruturais
- áreas prioritárias de intervenção
- custo provável de mantê-las sem ação

#### Condições de Bloqueio da Fase
- ausência de evidência suficiente para distinguir ruído local de dívida estrutural
- inconsistência severa nos registros da run
- impossibilidade de priorizar sem base mínima de impacto

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de manutenibilidade de achados cujo núcleo pertença a outro domínio
- destacar hotspots e barreiras prioritárias à evolução

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre estilo local, smell relevante e obstáculo estrutural

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- hotspot crítico subavaliado

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
- confirmar hotspots prioritários
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
- dívida técnica crítica mal resumida

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Estrutura Local, Convenções e Legibilidade
2. Complexidade, Code Smells e Duplicação
3. Modularidade, Coesão, Acoplamento e Modificabilidade
4. Testabilidade, Analisabilidade e Apoio à Evolução
5. Dívida Técnica Estrutural e Priorização de Correção
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
- conflito grave entre organização visível do código e capacidade real de análise

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita saúde evolutiva do código, não arquitetura macro do sistema.
- Problemas profundos de arquitetura, testes, segurança, observabilidade, performance ou infraestrutura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente a facilidade de leitura, análise, modificação ou refactoring do código, ele pode ser citado aqui como impacto de manutenibilidade, sem substituir a auditoria específica daquele domínio.

```


---

## Playbook: `seguranca.playbook.md`

Crie `/Auditoria/_framework/playbooks/seguranca.playbook.md` com o seguinte conteúdo:

```markdown
# Playbook do Domínio: seguranca

## Identificação
- dominio: seguranca
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o sistema possui controles de segurança minimamente robustos para reduzir risco de exploração, exposição indevida, manipulação não autorizada, vazamento de dados e comprometimento operacional.

## Aplicabilidade
Este playbook se aplica a qualquer projeto de software executável, especialmente quando houver:
- autenticação
- autorização
- APIs
- dados sensíveis
- painéis administrativos
- integrações externas
- upload de arquivos
- webhooks
- sessões, tokens ou credenciais
- execução em ambiente de rede

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto não expõe endpoints ou interfaces acessíveis externamente
- não existir autenticação no escopo real do sistema
- não houver upload, webhook, sessão, API pública ou armazenamento sensível aplicável
- o sistema auditado for apenas uma biblioteca local sem superfície operacional direta

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara da superfície de exposição do sistema
- avaliação dos controles de autenticação, autorização e sessão
- avaliação de validação de entrada, proteção de dados e tratamento de erro
- avaliação de segredos, configurações sensíveis, webhooks, integrações e supply chain
- consolidação dos principais riscos de exploração
- recomendações práticas priorizadas

## Referencial Base do Playbook
Este playbook usa como baseline:
- verificação de controles técnicos de aplicação
- riscos web críticos atuais
- riscos específicos de API
- abordagem prática de teste de autenticação, autorização, sessão, input validation, erro e criptografia

## Escopo Padrão da Run
- superfície exposta
- autenticação
- autorização
- sessão e tokens
- validação e sanitização de entrada
- proteção de dados e erros
- segredos e configuração sensível
- webhooks e integrações
- dependências e supply chain de aplicação
- mecanismos básicos de proteção operacional

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com segurança.
- Não expandir para performance, UX, arquitetura ou observabilidade detalhada, salvo quando houver impacto direto na segurança.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar controles exploráveis ou ausentes sobre preocupações cosméticas.
- Separar claramente vulnerabilidade confirmada, fragilidade de controle e hipótese de risco.

## Fases Oficiais da Run

### Fase 1 — Superfície de Exposição e Mapeamento de Controles
#### Objetivo
Mapear a superfície exposta do sistema e localizar onde os principais controles de segurança deveriam existir.

#### Checks Obrigatórios
- identificar endpoints, rotas, handlers, actions, controllers, gateways ou entrypoints expostos
- identificar áreas administrativas, rotas privilegiadas e fluxos sensíveis
- identificar integrações externas, webhooks, callbacks e canais alternativos
- identificar onde autenticação, autorização, validação, sessão e proteção de dados deveriam acontecer
- identificar arquivos de configuração, env vars, middleware e componentes de segurança relevantes
- identificar uploads, processamento de arquivos, templates, rendering dinâmico ou qualquer superfície de entrada rica

#### Evidências Esperadas
- código de rotas e handlers
- middlewares e guards
- config de auth, headers, cookies, session, JWT ou OAuth/OIDC
- arquivos de env/example, manifests, compose, pipelines ou deploy configs
- documentação de API e webhooks
- pontos de entrada web, mobile, admin ou API pública

#### Possíveis Achados
- superfície exposta não mapeada claramente
- rota sensível sem controle visível
- canal alternativo menos protegido
- webhook ou callback sem proteção aparente
- área administrativa com boundary fraca
- controles distribuídos de forma inconsistente

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais são os principais pontos expostos do sistema
- onde os controles de segurança deveriam estar
- quais áreas exigem verificação aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase
- impossibilidade de localizar a superfície de entrada do sistema
- ausência de acesso suficiente aos pontos de entrada relevantes
- inconsistência estrutural severa que impeça mapear fluxos básicos de segurança

---

### Fase 2 — Autenticação, Autorização e Sessão
#### Objetivo
Avaliar se o sistema autentica corretamente os usuários, aplica autorização de forma consistente e protege adequadamente sessões, tokens e canais equivalentes.

#### Checks Obrigatórios
- verificar mecanismos de autenticação e sua robustez aparente
- verificar separação entre autenticação e autorização
- verificar existência de controle de acesso por função, escopo, recurso ou objeto quando aplicável
- verificar se rotas privilegiadas exigem controle explícito
- verificar se há sinais de broken object level authorization ou broken function level authorization
- verificar gestão de sessão, cookies, expiração, revogação, logout e invalidação quando aplicável
- verificar uso de JWTs, API keys ou tokens equivalentes e seus controles básicos
- verificar recuperação de senha, troca de senha, MFA e fluxos alternativos quando existirem
- verificar se há brute-force protection, rate limit ou proteção mínima em pontos sensíveis quando aplicável

#### Evidências Esperadas
- middlewares, guards, policies ou decorators
- código de auth service, session handling, token issuing e token validation
- rotas administrativas e rotas de recurso
- configuração de cookies, flags de segurança e timeout
- fluxos de login, reset, invitation, magic link ou MFA
- testes de auth/authz, se existirem

#### Possíveis Achados
- autenticação fraca ou inconsistente
- autorização ausente ou parcial
- recurso acessível por ID sem checagem apropriada
- função privilegiada exposta sem proteção adequada
- sessão ou token sem controles mínimos
- logout ou revogação ineficaz
- fluxo alternativo mais fraco que o fluxo principal
- ausência de proteção básica contra abuso em rotas sensíveis

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- robustez de autenticação
- consistência de autorização
- qualidade dos controles de sessão ou token
- principais riscos de acesso indevido

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao fluxo de autenticação/autorização
- impossibilidade de determinar como o sistema autentica ou autoriza
- conflito grave entre implementação e configuração de segurança sem base suficiente para leitura segura

---

### Fase 3 — Validação de Entrada, Proteção de Dados e Tratamento de Erros
#### Objetivo
Avaliar se o sistema controla adequadamente entradas, reduz vetores clássicos de injeção e protege dados sensíveis em trânsito, processamento e saída.

#### Checks Obrigatórios
- verificar presença de validação estruturada de entrada
- verificar sanitização, escaping ou uso seguro de templating quando aplicável
- verificar risco de SQL injection, NoSQL injection, command injection, template injection, path traversal, SSRF, mass assignment e XSS quando aplicável
- verificar uso de queries parametrizadas, ORMs ou abstrações equivalentes de forma segura
- verificar exposição excessiva de dados em respostas, logs ou erros
- verificar tratamento de erro e vazamento de stack trace, exception details ou segredos
- verificar proteção de dados sensíveis em payloads, responses, logs, storage e configurações
- verificar uso de criptografia, hashing e transporte seguro quando aplicável
- verificar uploads e parsing de arquivos, se existirem

#### Evidências Esperadas
- schemas de validação
- DTOs, serializers, parsers e sanitizers
- consultas a banco, repositórios e builders de query
- controllers, services e handlers que recebem input externo
- templates, renderização, markdown, HTML ou conteúdo dinâmico
- logs, handlers de erro, filtros de exceção e responses
- fluxos de upload e armazenamento de arquivo

#### Possíveis Achados
- ausência de validação consistente
- trust excessivo em input externo
- risco de injection
- mass assignment ou binding perigoso
- exposição excessiva de dados
- erro detalhado demais em produção
- dado sensível exposto em logs ou respostas
- upload inseguro ou mal validado
- uso fraco ou inadequado de criptografia/segredos de transporte

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade da validação de entrada
- principais vetores de injeção ou exposição
- proteção de dados e erros
- riscos de manipulação indevida de entrada e saída

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às camadas que recebem e processam input
- impossibilidade de relacionar input externo ao processamento real
- forte inconsistência entre tipos/serialização e comportamento observável

---

### Fase 4 — Segredos, Configuração Sensível, Webhooks e Supply Chain
#### Objetivo
Avaliar se o sistema trata corretamente segredos, configurações sensíveis, integrações externas, webhooks e dependências relevantes para a postura de segurança.

#### Checks Obrigatórios
- verificar presença de segredos hardcoded ou valores sensíveis expostos no repositório
- verificar política aparente de uso de env vars, secret stores ou mecanismo equivalente
- verificar configuração de headers de segurança, CORS, CSP e defaults sensíveis quando aplicável
- verificar webhooks quanto a assinatura, validação, origem, replay, idempotência e tratamento de falhas quando aplicável
- verificar integrações externas quanto a credenciais, escopo e tratamento básico de erro
- verificar dependências críticas, pinagem, atualização aparente e riscos óbvios de supply chain
- verificar existência de artefatos inseguros de debug, defaults inseguros ou modos permissivos em produção
- verificar configuração de storage, buckets, filas e serviços externos quando afetarem diretamente segurança

#### Evidências Esperadas
- `.env.example`, configs, manifests, compose, helm, workflows, pipelines
- arquivos de webhook handling e integração externa
- package manifests, lockfiles e scanners configurados, se existirem
- middlewares e config de headers/CORS/CSP
- documentação operacional relevante
- referências a secret managers ou equivalents

#### Possíveis Achados
- segredo hardcoded
- configuração sensível exposta
- CORS permissivo sem justificativa
- headers de segurança ausentes onde fariam sentido
- webhook sem verificação de autenticidade
- replay window sem mitigação
- credencial excessiva ou mal segregada
- dependência crítica sem higiene mínima
- debug mode ou comportamento permissivo em ambiente sensível

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- postura de segredos e configuração sensível
- robustez de webhooks e integrações
- riscos óbvios de supply chain e exposição operacional

#### Condições de Bloqueio da Fase
- ausência de acesso à configuração mínima necessária
- impossibilidade de identificar como integrações ou webhooks são protegidos
- conflito grave entre configs e implementação sem base suficiente para leitura segura

---

### Fase 5 — Proteção Operacional e Preparação do Panorama de Risco
#### Objetivo
Avaliar mecanismos básicos de proteção operacional e preparar a consolidação de risco da run.

#### Checks Obrigatórios
- verificar existência de rate limiting, throttling ou proteção equivalente quando aplicável
- verificar proteção contra abuso em endpoints sensíveis
- verificar trilhas mínimas de auditoria para eventos relevantes quando aplicável
- verificar se logs evitam exposição indevida de segredos ou dados sensíveis
- verificar defaults de segurança em ambientes não locais quando inferíveis
- verificar existência de barreiras mínimas para endpoints administrativos, internos ou de manutenção
- verificar presença de indicadores de hardening mínimo do runtime quando aplicável

#### Evidências Esperadas
- middlewares de rate limit
- audit logs, event logs ou trilhas equivalentes
- proteção de rotas internas/admin
- filtros de log ou redaction
- configuração de ambientes
- mecanismos de abuse protection

#### Possíveis Achados
- endpoint sensível sem proteção operacional mínima
- ausência de rate limit onde seria esperado
- log de segredo ou dado sensível
- área administrativa insuficientemente segregada
- hardening operacional fraco
- trilha de auditoria inexistente para ações críticas

#### Critério de Conclusão da Fase
A fase pode ser concluída quando o panorama de risco operacional mínimo estiver claro o suficiente para consolidar a run.

#### Condições de Bloqueio da Fase
- falta de evidência suficiente para inferir proteções mínimas
- inconsistência grave entre runtime esperado e configurações observáveis
- impossibilidade de avaliar rotas críticas ou áreas administrativas

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de segurança de achados cujo núcleo pertença a outro domínio
- destacar os riscos exploráveis ou de maior impacto

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- diferenciação entre fragilidade, hipótese e problema confirmado

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco importante subavaliado

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
- risco crítico mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Superfície de Exposição e Mapeamento de Controles
2. Autenticação, Autorização e Sessão
3. Validação de Entrada, Proteção de Dados e Tratamento de Erros
4. Segredos, Configuração Sensível, Webhooks e Supply Chain
5. Proteção Operacional e Preparação do Panorama de Risco
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
- conflito grave entre configuração, documentação e implementação sem base suficiente para conclusão

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita segurança de aplicação e superfície operacional próxima.
- Vulnerabilidades profundas de arquitetura, observabilidade, testes, performance ou infraestrutura devem ser tratadas também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente segurança, ele pode ser citado aqui como impacto de segurança, sem substituir a auditoria específica daquele domínio.

```


---

## Playbook: `apis-integracoes.playbook.md`

Crie `/Auditoria/_framework/playbooks/apis-integracoes.playbook.md` com o seguinte conteúdo:

```markdown
# Playbook do Domínio: apis-integracoes

## Identificação
- dominio: apis-integracoes
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se as APIs e integrações do sistema possuem contratos claros, semântica consistente, tratamento adequado de erros, robustez operacional e superfície de integração suficientemente segura e previsível para consumidores internos e externos.

## Aplicabilidade
Este playbook se aplica a qualquer projeto que exponha ou consuma interfaces de integração, especialmente quando houver:
- APIs HTTP/REST
- webhooks
- callbacks
- integrações com terceiros
- filas, eventos ou mensageria
- SDKs ou clients internos relevantes
- comunicação entre serviços
- contratos públicos ou semipúblicos

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o sistema não expõe nem consome integrações relevantes
- o projeto é apenas uma biblioteca local sem interface de integração operacional
- não existem webhooks, eventos, filas ou contratos externos no escopo
- certos mecanismos, como versionamento ou idempotência, não fizerem sentido para a natureza da interface auditada

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara das interfaces de integração do sistema
- avaliação da qualidade dos contratos e da semântica das APIs
- avaliação de tratamento de erros, paginação, versionamento e compatibilidade
- avaliação de webhooks, callbacks e integrações externas
- avaliação de robustez operacional, idempotência e tolerância a falhas nas integrações
- consolidação dos principais riscos e recomendações práticas

## Referencial Base do Playbook
Este playbook usa como baseline:
- semântica HTTP coerente com métodos, recursos e códigos de status
- contratos de API descritos e compreensíveis
- APIs seguras contra riscos típicos de superfície e autorização
- operações não idempotentes tratadas de forma robusta quando necessário
- integrações externas e webhooks com comportamento previsível e rastreável

## Escopo Padrão da Run
- inventário de APIs e integrações
- contratos, schemas e documentação
- semântica de métodos e status codes
- consistência de request/response
- paginação, filtros, ordenação e versionamento quando aplicáveis
- erros e envelopes de erro
- idempotência, retries e duplicidade
- webhooks, callbacks e eventos
- robustez de integrações externas
- riscos típicos de segurança de API e exposição indevida

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com APIs e integrações.
- Não expandir para segurança profunda, arquitetura macro ou observabilidade detalhada, salvo quando houver impacto direto na qualidade da integração.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar quebras de contrato, semântica inconsistente, integrações frágeis e riscos claros de consumo incorreto.
- Diferenciar claramente:
  - inconsistência de contrato
  - fragilidade operacional
  - risco de segurança de API
  - hipótese de integração mal definida

## Fases Oficiais da Run

### Fase 1 — Inventário de Interfaces, Contratos e Escopo de Integração
#### Objetivo
Identificar quais interfaces de integração o sistema expõe ou consome e localizar os artefatos que definem seus contratos.

#### Checks Obrigatórios
- identificar endpoints, rotas, handlers, controllers ou gateways expostos
- identificar integrações externas consumidas pelo sistema
- identificar webhooks, callbacks, eventos, filas ou canais equivalentes
- localizar documentação de API, schemas, OpenAPI, clients, SDKs ou contratos equivalentes
- verificar se a superfície de integração está minimamente inventariada
- verificar se existem contratos implícitos demais, dependentes apenas do código

#### Evidências Esperadas
- arquivos de rotas e handlers
- documentação OpenAPI ou equivalente
- clients HTTP/RPC
- contratos de evento, webhook ou fila
- README técnico ou docs de integração
- gateways, adapters ou middleware de integração

#### Possíveis Achados
- API sem contrato documentado
- integração externa relevante sem documentação mínima
- webhook implícito demais
- superfície de integração pouco clara
- evento ou fila sem contrato compreensível
- dependência de integração acoplada a comportamento implícito do código

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais interfaces existem
- quais contratos as descrevem
- quais integrações merecem análise aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase
- impossibilidade de identificar as interfaces reais do sistema
- ausência de acesso suficiente aos artefatos que expõem ou consomem integrações
- inconsistência severa que impeça mapear a superfície de integração

---

### Fase 2 — Semântica HTTP, Contratos e Consistência de Request/Response
#### Objetivo
Avaliar se as APIs HTTP usam semântica consistente e se seus contratos de entrada e saída são claros, estáveis e previsíveis para consumidores.

#### Checks Obrigatórios
- verificar uso coerente de métodos HTTP para o comportamento declarado
- verificar coerência de status codes com o resultado real das operações
- verificar se requests e responses seguem contratos claros e consistentes
- verificar clareza de schemas, campos obrigatórios, opcionais e formatos
- verificar se recursos, nomes, paths e operações seguem convenção compreensível
- verificar se envelopes, paginação, filtros, ordenação e parâmetros são consistentes quando aplicáveis
- verificar se a API parece previsível para um consumidor sem depender de leitura profunda do código

#### Evidências Esperadas
- OpenAPI/specs/schemas
- exemplos de request/response
- controllers, serializers, DTOs, validators e mappers
- documentação de parâmetros e respostas
- exemplos de paginação, filtro e sort
- uso real de status codes e payloads

#### Possíveis Achados
- método HTTP semanticamente inadequado
- status code inconsistente
- contrato ambíguo
- schema incompleto ou implícito
- response shape inconsistente
- paginação ou filtros incoerentes
- naming de recurso confuso
- dependência excessiva de comportamento não documentado

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade semântica da API
- previsibilidade dos contratos
- consistência geral de request/response

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos contratos ou handlers relevantes
- impossibilidade de relacionar documentação e implementação
- inconsistência severa entre spec e comportamento do código

---

### Fase 3 — Erros, Idempotência, Versionamento e Compatibilidade
#### Objetivo
Avaliar se a interface trata falhas de forma previsível, suporta operações sensíveis com robustez razoável e preserva compatibilidade ao longo do tempo.

#### Checks Obrigatórios
- verificar se erros possuem estrutura minimamente consistente
- verificar se mensagens de erro ajudam consumo, troubleshooting e automação
- verificar se operações não idempotentes sensíveis possuem estratégia de idempotência quando necessário
- verificar risco de duplicidade em retries, timeouts ou falhas de rede
- verificar se há versionamento, compatibilidade ou estratégia de evolução da interface quando aplicável
- verificar tratamento de breaking changes ou drift de contrato
- verificar se consumidores internos/externos seriam afetados por mudanças aparentemente simples

#### Evidências Esperadas
- envelopes de erro
- status codes de erro
- retries, deduplication, idempotency keys ou mecanismos equivalentes
- changelogs, versionamento em path/header/schema quando existirem
- documentação de compatibilidade
- logs ou código de tratamento de falhas em integração

#### Possíveis Achados
- erro inconsistente ou pouco utilizável
- duplicidade por falta de idempotência
- retry inseguro
- breaking change sem estratégia
- interface evoluindo sem compatibilidade clara
- consumidor exposto a drift de contrato
- mudança simples com alto risco de quebra de integração

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- previsibilidade de erro
- robustez para retries/reexecução
- maturidade de compatibilidade e evolução da interface

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às camadas de erro ou retry
- impossibilidade de inferir política de compatibilidade
- conflito grave entre contrato, operação e estratégia de reexecução

---

### Fase 4 — Webhooks, Callbacks, Eventos e Integrações Externas
#### Objetivo
Avaliar se interfaces reativas e integrações externas são robustas, seguras e operacionalmente tratáveis.

#### Checks Obrigatórios
- verificar se webhooks ou callbacks têm contrato claro
- verificar se origem, autenticação, assinatura ou validação mínima existem quando aplicável
- verificar se há proteção contra replay, duplicidade e reentrega quando necessário
- verificar se eventos, filas ou mensagens possuem contrato compreensível e tratamento de erro adequado
- verificar se integrações externas possuem timeout, retry, idempotência ou fallback coerentes quando aplicável
- verificar se há acoplamento excessivo a comportamento frágil de terceiros
- verificar se falhas em integração externa produzem comportamento previsível no sistema

#### Evidências Esperadas
- handlers de webhook
- validação de assinatura ou headers relevantes
- contratos de evento ou payload
- consumers/producers
- clients externos
- configuração de retries, timeout e deduplication
- documentação de integração e callbacks

#### Possíveis Achados
- webhook sem validação mínima
- callback frágil
- replay ou duplicidade não tratados
- evento sem contrato claro
- integração externa sem timeout
- dependência frágil de terceiro
- falha externa mal tratada
- acoplamento alto a detalhe operacional externo

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- robustez de webhooks/eventos
- fragilidade de integrações externas
- riscos principais de quebra ou comportamento imprevisível

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos fluxos de integração
- impossibilidade de identificar contratos ou garantias mínimas
- conflito severo entre documentação e implementação da integração

---

### Fase 5 — Segurança de API, Exposição Indevida e Consumo de Recursos
#### Objetivo
Avaliar riscos típicos de segurança e operação associados à superfície de API, especialmente autorização, exposição de dados e consumo indevido de recursos.

#### Checks Obrigatórios
- verificar se a API demonstra sinais de controle de acesso por recurso/objeto quando necessário
- verificar se propriedades sensíveis parecem filtradas adequadamente
- verificar risco de exposição excessiva de dados
- verificar se há proteção razoável contra consumo irrestrito de recursos quando aplicável
- verificar se integrações consumidas pelo sistema são tratadas de forma segura e defensiva
- verificar se endpoints internos, administrativos ou menos visíveis possuem proteção consistente
- verificar se a API parece desenhada para consumo seguro, sem pressupostos frágeis

#### Evidências Esperadas
- guards, policies, checks de recurso
- serializers, field filtering, DTOs
- limites, paginação, rate control ou mecanismos equivalentes
- clients externos e validações de resposta
- rotas internas/admin
- exemplos de payloads e responses

#### Possíveis Achados
- broken object-level authorization provável
- exposição excessiva de propriedades
- API consumindo integração externa de forma insegura
- consumo irrestrito de recurso
- endpoint administrativo exposto de forma inconsistente
- contrato que induz consumidor a comportamento arriscado
- validação insuficiente de resposta externa

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- principais riscos de segurança de API e integração
- exposição indevida de dados ou recursos
- fragilidades relevantes no consumo e exposição de interfaces

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às rotas e controles relevantes
- impossibilidade de relacionar dados expostos a regras de autorização
- inconsistência severa que impeça inferir postura mínima de segurança da API

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de APIs/integrações de achados cujo núcleo pertença a outro domínio
- destacar quebras de contrato, fragilidades operacionais e riscos de consumo prioritários

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre inconsistência de contrato, fragilidade operacional e risco de segurança

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco de integração crítica subavaliado

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
- quebra crítica de contrato mal resumida

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Inventário de Interfaces, Contratos e Escopo de Integração
2. Semântica HTTP, Contratos e Consistência de Request/Response
3. Erros, Idempotência, Versionamento e Compatibilidade
4. Webhooks, Callbacks, Eventos e Integrações Externas
5. Segurança de API, Exposição Indevida e Consumo de Recursos
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
- conflito grave entre contrato, documentação e comportamento real da integração

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita interfaces de integração, contratos e robustez operacional da superfície de API.
- Problemas profundos de segurança, arquitetura, observabilidade, performance ou infraestrutura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente previsibilidade, consumo ou robustez da integração, ele pode ser citado aqui como impacto em APIs/integrações, sem substituir a auditoria específica daquele domínio.

```


---

## Playbook: `dados-persistencia.playbook.md`

Crie `/Auditoria/_framework/playbooks/dados-persistencia.playbook.md` com o seguinte conteúdo:

```markdown
# Playbook do Domínio: dados-persistencia

## Identificação
- dominio: dados-persistencia
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se a camada de dados do sistema está modelada, protegida e operada de forma que preserve integridade, consistência, concorrência segura, evolutividade e capacidade de recuperação ao longo do tempo.

## Aplicabilidade
Este playbook se aplica a qualquer projeto com persistência relevante, especialmente quando houver:
- banco relacional
- banco documental
- múltiplos stores
- migrations
- dados transacionais
- concorrência entre operações
- filas com persistência
- storage ou retenção relevante
- necessidades de histórico, auditoria ou reprocessamento

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o sistema não possui persistência relevante no escopo
- o projeto é apenas uma biblioteca local sem state store próprio
- não existem migrations, banco ou stores permanentes relevantes
- certos mecanismos específicos, como foreign keys ou transações multi-document, não fizerem sentido para o tipo de store usado

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara do desenho de persistência do sistema
- avaliação de modelagem, integridade e consistência
- avaliação de índices, queries e acesso a dados do ponto de vista estrutural
- avaliação de concorrência, isolamento e comportamento transacional
- avaliação de migrations, versionamento e segurança de evolução do schema
- avaliação de retenção, ciclo de vida, backup e recuperação quando aplicáveis
- recomendações práticas priorizadas

## Referencial Base do Playbook
Este playbook usa como baseline:
- integridade protegida por constraints ou mecanismos equivalentes
- modelagem guiada por padrões reais de acesso
- índices criados com benefício claro e trade-off consciente
- isolamento transacional e concorrência tratados explicitamente quando necessário
- mudanças de schema versionadas, repetíveis e aplicadas de forma controlada
- ciclo de vida dos dados e recuperação considerados como parte da qualidade da persistência

## Escopo Padrão da Run
- stores e bancos relevantes
- modelagem de dados
- constraints e integridade
- índices e acesso a dados
- transações e isolamento
- concorrência e contenção
- migrations e evolução de schema
- retenção, arquivamento e ciclo de vida
- backup, restore e recuperação
- riscos estruturais de consistência e perda de dados

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com dados e persistência.
- Não expandir para performance, segurança ou arquitetura detalhada, salvo quando houver impacto direto na camada de dados.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar problemas que comprometam integridade, consistência, recuperação, concorrência segura ou evolução do schema.
- Diferenciar claramente:
  - limitação intencional do modelo
  - fragilidade estrutural
  - risco operacional de dados
  - inconsistência confirmada

## Fases Oficiais da Run

### Fase 1 — Inventário de Stores, Modelo e Padrões de Acesso
#### Objetivo
Identificar quais stores existem, como os dados estão distribuídos e se o modelo parece coerente com os padrões reais de acesso do sistema.

#### Checks Obrigatórios
- identificar bancos, stores, caches persistentes, filas com retenção e qualquer repositório de dados relevante
- identificar entidades, coleções, tabelas, documentos ou agregados principais
- identificar padrões principais de leitura, escrita, atualização e consulta
- verificar se o modelo de dados aparenta seguir os padrões reais de acesso
- verificar se existem múltiplos stores com responsabilidade clara ou sobreposição confusa
- verificar se o desenho de persistência é compreensível o suficiente para auditoria posterior

#### Evidências Esperadas
- schemas, models, entidades, migrations ou contratos de persistência
- código de repositories, DAOs, queries, pipelines ou mappers
- documentação de banco ou diagramas, se existirem
- configuração de conexão e infraestrutura de dados
- sinais de stores secundários ou especializados

#### Possíveis Achados
- persistência distribuída sem responsabilidade clara
- modelo desconectado do padrão real de acesso
- store redundante ou confuso
- entidade ou coleção central mal compreendida
- acoplamento excessivo entre camadas e desenho de persistência
- inventário de dados pouco claro

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais stores existem
- quais estruturas de dados principais o sistema usa
- como o sistema lê e grava dados de forma predominante

#### Condições de Bloqueio da Fase
- impossibilidade de identificar o store principal
- ausência de acesso suficiente aos artefatos de persistência
- inconsistência severa que impeça mapear o modelo básico

---

### Fase 2 — Integridade, Constraints e Qualidade do Modelo
#### Objetivo
Avaliar se a integridade dos dados é protegida por constraints, regras de schema ou mecanismos equivalentes, e se o modelo favorece consistência ao longo do tempo.

#### Checks Obrigatórios
- verificar presença de chaves primárias, unicidade, foreign keys, checks, not null ou equivalentes quando fizer sentido
- verificar se restrições de domínio importantes estão protegidas no nível de persistência ou por mecanismo equivalente explícito
- verificar se o schema ou modelo ajuda a impedir estados inválidos
- verificar se dados relacionados mantêm vínculo consistente
- verificar se o desenho favorece qualidade de dados ou delega demais à aplicação sem proteção equivalente
- verificar se propriedades importantes estão corretamente tipadas e limitadas

#### Evidências Esperadas
- DDL, migrations, schema files, models ou validators
- constraints declaradas
- relacionamentos e referências
- documentos ou coleções com validação quando aplicável
- código que aplica regras críticas de consistência
- catálogos ou introspecção de banco, quando acessível

#### Possíveis Achados
- ausência de constraint relevante
- unicidade não garantida
- relacionamento sem proteção adequada
- dado inválido possível por desenho
- integridade dependente apenas de disciplina da aplicação
- schema permissivo demais para dado crítico
- regra de domínio importante sem enforcement claro

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- robustez da integridade no modelo
- qualidade estrutural do schema
- principais fragilidades de consistência no nível de persistência

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao schema real
- impossibilidade de inferir constraints ou regras equivalentes
- conflito severo entre modelo declarado e persistência real

---

### Fase 3 — Índices, Queries e Acesso a Dados
#### Objetivo
Avaliar se o acesso a dados está apoiado por índices e estratégias coerentes com as consultas reais, sem gerar custo estrutural desnecessário ou gargalos previsíveis.

#### Checks Obrigatórios
- verificar existência de índices coerentes com filtros, joins, buscas ou ordenações principais
- verificar ausência de índice óbvia em caminhos críticos
- verificar excesso de índices sem justificativa aparente
- verificar se queries críticas parecem alinhadas ao desenho dos índices
- verificar risco de scans excessivos, fan-out ou acesso ineficiente a dados
- verificar se o modelo de acesso favorece ou prejudica consulta eficiente
- verificar se índices especiais, compostos ou por expressão parecem fazer sentido quando usados

#### Evidências Esperadas
- definição de índices
- migrations de índices
- queries, repositories, builders ou pipelines
- planos de acesso quando existirem
- padrões de filtro, join, sort e busca
- documentação de modelagem/indexação, se existir

#### Possíveis Achados
- falta de índice em consulta crítica
- índice redundante
- índice que piora escrita sem benefício claro
- query desalinhada com índices
- fan-out excessivo
- busca custosa por desenho de dados
- estratégia de indexação fraca ou desatualizada
- caminho de acesso incompatível com o padrão real de uso

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- adequação dos índices
- coerência entre queries e modelagem
- principais riscos estruturais de acesso a dados

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às queries ou índices relevantes
- impossibilidade de relacionar consulta ao store correspondente
- inconsistência severa entre o que é consultado e o que é indexado

---

### Fase 4 — Transações, Isolamento, Concorrência e Consistência
#### Objetivo
Avaliar se o sistema trata concorrência, isolamento e consistência transacional de forma compatível com seus fluxos críticos.

#### Checks Obrigatórios
- verificar se operações críticas usam transação quando necessário
- verificar se o nível de isolamento padrão ou explícito é compatível com o tipo de operação
- verificar risco de lost update, leitura inconsistente, escrita concorrente problemática ou efeito equivalente
- verificar uso de locking explícito, optimistic concurrency ou mecanismo equivalente quando fizer sentido
- verificar se operações distribuídas ou multi-store possuem estratégia clara de consistência
- verificar se reprocessamento, retries ou concorrência podem produzir inconsistência ou duplicidade
- verificar se o modelo suporta concorrência segura para os fluxos críticos

#### Evidências Esperadas
- código transacional
- configuração de isolamento
- uso de locks, version fields, compare-and-set, optimistic locking ou equivalentes
- tratamento de conflito e retry
- workers, filas e consumidores concorrentes
- documentação de comportamento transacional, se existir

#### Possíveis Achados
- operação crítica sem transação adequada
- isolamento insuficiente para o caso de uso
- concorrência insegura
- risco de lost update ou inconsistência concorrente
- locking ausente ou inadequado
- consistência entre stores mal definida
- retry gerando efeito duplicado sobre dados

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- tratamento transacional do sistema
- postura frente à concorrência
- principais riscos de consistência e duplicidade

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao fluxo transacional real
- impossibilidade de inferir política de isolamento ou concorrência
- conflito grave entre desenho, código e comportamento esperado da persistência

---

### Fase 5 — Evolução de Schema, Migrations e Ciclo de Vida dos Dados
#### Objetivo
Avaliar se o sistema evolui seu schema de forma controlada e se trata ciclo de vida, retenção, backup e recuperação com maturidade mínima.

#### Checks Obrigatórios
- verificar se migrations ou mecanismo equivalente são versionados e repetíveis
- verificar se mudanças de schema parecem aplicadas em ordem e de forma rastreável
- verificar se há prática de roll forward em vez de mutar migrations antigas já aplicadas
- verificar se o processo de mudança parece seguro para múltiplos ambientes
- verificar se há estratégia mínima de retenção, arquivamento ou descarte quando aplicável
- verificar se backup e restore ou mecanismos equivalentes são considerados
- verificar se recuperação de dados e continuidade de store crítico têm base mínima
- verificar se mudanças estruturais parecem compatíveis com dados já existentes

#### Evidências Esperadas
- ferramentas e arquivos de migration
- histórico de migrations
- version control de schema
- políticas de retenção, arquivamento ou purge quando existirem
- documentação de backup/restore e continuidade, se existir
- mudanças de schema e data migrations relacionadas

#### Possíveis Achados
- migration sem versionamento confiável
- mudança de schema mutável após aplicação
- risco alto em evolução entre ambientes
- ausência de estratégia de retenção
- backup/restore não considerado
- recuperação de store crítico fraca
- incompatibilidade entre schema novo e dados existentes
- evolução estrutural sem disciplina suficiente

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- maturidade de evolução do schema
- disciplina de migrations
- postura frente a retenção e recuperação de dados

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao mecanismo de migration
- impossibilidade de inferir histórico de evolução do schema
- conflito severo entre estado atual do banco e artefatos de evolução

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de dados/persistência de achados cujo núcleo pertença a outro domínio
- destacar riscos de integridade, concorrência, evolução e recuperação prioritários

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre limitação de modelo, fragilidade de integridade e risco operacional de dados

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco crítico de consistência ou recuperação subavaliado

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
- risco crítico de dados mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Inventário de Stores, Modelo e Padrões de Acesso
2. Integridade, Constraints e Qualidade do Modelo
3. Índices, Queries e Acesso a Dados
4. Transações, Isolamento, Concorrência e Consistência
5. Evolução de Schema, Migrations e Ciclo de Vida dos Dados
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
- conflito grave entre schema, migrations e comportamento real da persistência

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita persistência como disciplina de modelagem, integridade, concorrência, evolução e recuperação de dados.
- Problemas profundos de performance, segurança, arquitetura ou confiabilidade devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente integridade, consistência, recuperação ou evolução de dados, ele pode ser citado aqui como impacto de persistência, sem substituir a auditoria específica daquele domínio.

```


---

## Playbook: `performance-escalabilidade.playbook.md`

Crie `/Auditoria/_framework/playbooks/performance-escalabilidade.playbook.md` com o seguinte conteúdo:

```markdown
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

```


---

## Playbook: `confiabilidade-resiliencia.playbook.md`

Crie `/Auditoria/_framework/playbooks/confiabilidade-resiliencia.playbook.md` com o seguinte conteúdo:

```markdown
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

```


---

## Playbook: `observabilidade-operacao.playbook.md`

Crie `/Auditoria/_framework/playbooks/observabilidade-operacao.playbook.md` com o seguinte conteúdo:

```markdown
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

```


---

## Playbook: `testes-qualidade.playbook.md`

Crie `/Auditoria/_framework/playbooks/testes-qualidade.playbook.md` com o seguinte conteúdo:

```markdown
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

```


---

## Playbook: `ui-ux-fluxos.playbook.md`

Crie `/Auditoria/_framework/playbooks/ui-ux-fluxos.playbook.md` com o seguinte conteúdo:

```markdown
# Playbook do Domínio: ui-ux-fluxos

## Identificação
- dominio: ui-ux-fluxos
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se a interface do sistema e seus fluxos principais são claros, consistentes, acessíveis, previsíveis e eficazes para permitir que usuários executem tarefas relevantes com baixo atrito e baixa taxa de erro.

## Aplicabilidade
Este playbook se aplica a qualquer projeto com interface humana relevante, especialmente quando houver:
- frontend web
- painel administrativo
- aplicação interna
- fluxos de formulários
- dashboards
- área autenticada
- navegação entre telas
- ações críticas com impacto operacional
- componentes interativos complexos

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto não possui interface de usuário no escopo
- a interface ainda não existe de forma minimamente navegável
- certos critérios específicos, como padrões ARIA avançados, não fizerem sentido para o tipo de interface auditada
- o sistema auditado for apenas backend ou biblioteca sem experiência de interface própria

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara da qualidade dos fluxos principais
- avaliação de clareza, consistência e previsibilidade da interface
- avaliação de estados de sistema, feedback, erros e recuperação
- avaliação de acessibilidade básica e padrões de interação
- avaliação da navegabilidade e conclusão de tarefas
- consolidação dos principais pontos de atrito e recomendações práticas

## Referencial Base do Playbook
Este playbook usa como baseline:
- acessibilidade como parte obrigatória da qualidade de interface
- padrões de interação semanticamente corretos
- visibilidade de estado do sistema
- prevenção de erros e apoio à recuperação
- consistência, reconhecimento e redução de carga cognitiva
- fluxo orientado à tarefa real do usuário

## Escopo Padrão da Run
- estrutura da interface
- navegação e arquitetura de fluxo
- consistência visual e comportamental
- feedback de sistema e estados de interface
- formulários, validação e tratamento de erro
- acessibilidade básica
- semântica e padrões de componentes interativos
- responsividade e usabilidade prática
- conclusão de tarefas principais
- atritos funcionais e cognitivos

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com UI, UX e fluxos funcionais.
- Não expandir para performance, segurança ou arquitetura detalhada, salvo quando houver impacto direto na experiência do usuário.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar problemas que impeçam, confundam, atrasem ou distorçam a execução de tarefas relevantes.
- Diferenciar claramente:
  - inconsistência visual menor
  - problema de usabilidade
  - quebra de fluxo funcional
  - problema de acessibilidade
  - risco de erro operacional do usuário

## Fases Oficiais da Run

### Fase 1 — Inventário de Fluxos, Tarefas e Estrutura de Navegação
#### Objetivo
Identificar quais são os fluxos principais da interface, quais tarefas o usuário precisa concluir e como a navegação organiza essas tarefas.

#### Checks Obrigatórios
- identificar telas, páginas, áreas e componentes centrais
- identificar jornadas principais do usuário
- identificar ações críticas e ações frequentes
- verificar se a navegação parece coerente com as tarefas reais
- verificar se a arquitetura da informação ajuda ou atrapalha a localização de funcionalidades
- verificar se o usuário consegue inferir onde está e para onde pode ir

#### Evidências Esperadas
- mapa de páginas e rotas
- menus, sidebars, tabs, breadcrumbs ou navegação equivalente
- fluxos de cadastro, login, busca, criação, edição, exclusão ou ações críticas
- estrutura visual da interface
- documentação funcional, se existir
- comportamento observável das jornadas principais

#### Possíveis Achados
- fluxo principal difícil de localizar
- arquitetura de navegação confusa
- ação crítica escondida ou mal posicionada
- excesso de caminhos paralelos sem clareza
- usuário sem noção de contexto ou posição
- estrutura da interface desalinhada às tarefas reais

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais são os fluxos principais
- como o usuário navega entre eles
- quais tarefas merecem análise aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase
- impossibilidade de identificar os fluxos principais
- ausência de acesso suficiente às telas ou rotas relevantes
- inconsistência severa que impeça mapear a navegação básica

---

### Fase 2 — Clareza, Consistência e Feedback de Sistema
#### Objetivo
Avaliar se a interface comunica bem o que está acontecendo, usa linguagem compreensível e mantém consistência visual e comportamental ao longo dos fluxos.

#### Checks Obrigatórios
- verificar visibilidade de estado do sistema
- verificar se ações geram feedback claro, oportuno e proporcional
- verificar consistência de labels, padrões visuais, botões, ações e componentes
- verificar se a interface usa linguagem compatível com o usuário em vez de jargão interno desnecessário
- verificar se a relação entre ação e resultado é fácil de entender
- verificar se estados como loading, sucesso, vazio, erro e indisponibilidade são tratados com clareza

#### Evidências Esperadas
- telas em estados diferentes
- toasts, banners, mensagens inline e confirmações
- rótulos, CTAs e textos de apoio
- padrões visuais e comportamento de componentes
- estados vazios, erro e sucesso
- feedback após ações críticas

#### Possíveis Achados
- falta de feedback
- feedback tardio ou ambíguo
- inconsistência visual/comportamental
- texto confuso ou técnico demais
- estado de sistema invisível
- comportamento imprevisível de componentes
- ação sem confirmação clara de resultado

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade da comunicação da interface
- consistência de padrões
- capacidade do sistema de informar o usuário durante a jornada

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos estados relevantes da interface
- impossibilidade de observar feedback de ações importantes
- inconsistência severa entre telas que impeça inferência coerente

---

### Fase 3 — Formulários, Erros, Prevenção e Recuperação
#### Objetivo
Avaliar se o sistema ajuda o usuário a inserir dados corretamente, previne erros previsíveis e apoia recuperação quando erros acontecem.

#### Checks Obrigatórios
- verificar clareza de formulários, campos, labels, placeholders e ajuda contextual
- verificar validação inline e/ou pós-submissão quando aplicável
- verificar se mensagens de erro são úteis, específicas e acionáveis
- verificar se o sistema previne erros comuns quando possível
- verificar se ações destrutivas ou críticas têm proteção proporcional
- verificar se o usuário consegue recuperar-se de erro sem reiniciar a jornada inteira
- verificar se o sistema diferencia bem erro de usuário, erro de sistema e estado bloqueado

#### Evidências Esperadas
- formulários principais
- fluxos de cadastro, login, edição, filtros e busca
- mensagens de validação
- diálogos de confirmação
- tratamento de erro em ações críticas
- possibilidade de correção e retorno ao fluxo

#### Possíveis Achados
- formulário confuso
- validação insuficiente ou tardia
- mensagem de erro genérica
- prevenção de erro ausente
- confirmação crítica inexistente
- recuperação difícil
- perda de dados por erro simples
- distinção ruim entre falha do sistema e erro do usuário

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade dos formulários
- capacidade de prevenção de erro
- apoio à recuperação e continuidade do fluxo

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos fluxos de entrada e submissão
- impossibilidade de observar estados de erro e recuperação
- inconsistência severa nos formulários que impeça avaliação coerente

---

### Fase 4 — Acessibilidade, Semântica e Padrões de Interação
#### Objetivo
Avaliar se a interface respeita princípios básicos de acessibilidade e se os componentes interativos seguem padrões semanticamente corretos e operáveis.

#### Checks Obrigatórios
- verificar se a interface aparenta seguir princípios básicos de WCAG
- verificar uso coerente de headings, landmarks, labels e semântica estrutural
- verificar navegabilidade por teclado quando aplicável
- verificar foco visível e ordem de foco coerente
- verificar contraste, legibilidade e clareza visual mínima
- verificar se componentes interativos complexos seguem padrões de interação acessíveis
- verificar uso de ARIA somente quando necessário e de forma coerente quando aplicável
- verificar se estados e controles são percebidos por tecnologias assistivas em cenário razoável

#### Evidências Esperadas
- HTML/markup ou estrutura equivalente
- componentes interativos
- estados de foco e navegação
- labels, roles, aria-attributes e semantics quando existirem
- modais, accordions, menus, tabs, comboboxes ou widgets equivalentes
- mensagens e feedback acessíveis

#### Possíveis Achados
- semântica fraca ou incorreta
- componente inacessível por teclado
- foco invisível ou perdido
- ordem de navegação confusa
- contraste insuficiente
- uso inadequado de ARIA
- widget customizado sem padrão acessível
- feedback não perceptível para todos os usuários

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- acessibilidade básica da interface
- qualidade semântica dos componentes
- aderência mínima a padrões de interação acessíveis

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente à estrutura interativa da interface
- impossibilidade de inspecionar componentes relevantes
- inconsistência severa que impeça avaliar padrões básicos de acessibilidade

---

### Fase 5 — Conclusão de Tarefa, Eficiência e Atrito de Fluxo
#### Objetivo
Avaliar se o usuário consegue concluir tarefas principais com eficiência razoável, baixa carga cognitiva e poucos obstáculos desnecessários.

#### Checks Obrigatórios
- verificar número de passos, desvios e fricções nos fluxos principais
- verificar se a interface favorece reconhecimento em vez de memorização
- verificar se o usuário pode desfazer ou corrigir ações quando apropriado
- verificar se o fluxo minimiza trabalho repetitivo e decisões desnecessárias
- verificar se a responsividade da interface ajuda ou atrapalha a tarefa
- verificar se o design suporta usuários iniciantes e frequentes de forma equilibrada
- verificar se a jornada principal pode ser concluída sem confusão relevante

#### Evidências Esperadas
- execução das tarefas principais
- caminhos de ida e volta entre telas
- estados de edição, cancelamento, retorno e confirmação
- observação da quantidade de passos
- presença de shortcuts, defaults úteis ou auxílio contextual quando aplicáveis
- áreas com atrito recorrente evidente

#### Possíveis Achados
- fluxo longo demais
- carga cognitiva alta
- excesso de passos
- navegação circular ou confusa
- tarefa principal com atrito evitável
- ausência de "saída de emergência" ou desfazer
- necessidade excessiva de memorização
- interface pouco eficiente para uso recorrente

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- eficiência dos fluxos principais
- grau de atrito operacional
- principais barreiras à conclusão de tarefa

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às jornadas principais
- impossibilidade de completar ou simular fluxos mínimos
- inconsistência severa que impeça avaliar conclusão de tarefa

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de UI/UX/fluxos de achados cujo núcleo pertença a outro domínio
- destacar barreiras à conclusão de tarefa, acessibilidade e previsibilidade da interface

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre problema cosmético, problema de usabilidade e quebra real de fluxo

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- barreira crítica de fluxo subavaliada

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
- risco crítico de fluxo mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- barreira crítica sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Inventário de Fluxos, Tarefas e Estrutura de Navegação
2. Clareza, Consistência e Feedback de Sistema
3. Formulários, Erros, Prevenção e Recuperação
4. Acessibilidade, Semântica e Padrões de Interação
5. Conclusão de Tarefa, Eficiência e Atrito de Fluxo
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
- conflito grave entre fluxo desenhado, interface observada e comportamento real do sistema

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita interface, usabilidade, acessibilidade e qualidade de fluxo funcional.
- Problemas profundos de performance, segurança, arquitetura ou observabilidade devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente clareza, fluidez, feedback ou conclusão de tarefa, ele pode ser citado aqui como impacto em UI/UX/fluxos, sem substituir a auditoria específica daquele domínio.

```


---

## Playbook: `infraestrutura-deploy-config.playbook.md`

Crie `/Auditoria/_framework/playbooks/infraestrutura-deploy-config.playbook.md` com o seguinte conteúdo:

```markdown
# Playbook do Domínio: infraestrutura-deploy-config

## Identificação
- dominio: infraestrutura-deploy-config
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se a infraestrutura de execução, a estratégia de deploy e a gestão de configuração do sistema são suficientemente controladas, seguras e previsíveis para sustentar entrega contínua, operação consistente entre ambientes e recuperação prática em caso de falha.

## Aplicabilidade
Este playbook se aplica a qualquer projeto que rode fora do editor local, especialmente quando houver:
- deploy em servidor, cloud, PaaS, containers ou Kubernetes
- múltiplos ambientes
- CI/CD
- variáveis de ambiente ou configuração externa
- segredos
- pipelines de build
- imagens, artefatos ou pacotes publicáveis
- rollout, rollback ou release management
- backups, restore ou continuidade operacional relevante

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto ainda não possui ambiente de execução real
- não existe deploy automatizado ou infraestrutura fora do contexto local
- certos mecanismos específicos, como Kubernetes manifests, não fizerem sentido para o tipo de runtime usado
- o sistema for apenas uma biblioteca sem processo próprio de entrega e execução

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara dos ambientes, artefatos e mecanismos de deploy
- avaliação da separação entre código, configuração e segredos
- avaliação do pipeline de build e entrega
- avaliação de rollout, rollback e consistência entre ambientes
- avaliação de hygiene mínima de supply chain e configuração
- consolidação dos principais riscos operacionais e recomendações práticas

## Referencial Base do Playbook
Este playbook usa como baseline:
- configuração separada do código
- segredos tratados de forma distinta de configuração comum
- pipelines e builds com rastreabilidade e controles mínimos
- deploys controlados e passíveis de observação e reversão
- ambientes com divergência reduzida e comportamento previsível
- cadeia de build e artefatos com postura mínima de integridade

## Escopo Padrão da Run
- ambientes e topologia de execução
- configuração e env vars
- segredos e dados sensíveis de runtime
- build, artefatos e imagens
- pipeline CI/CD e gates de entrega
- rollout, rollback e strategy de release
- consistência entre ambientes
- drift e mutação manual relevante
- backup, restore e recuperação quando aplicáveis
- riscos operacionais de infraestrutura e deploy

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com infraestrutura, deploy e configuração.
- Não expandir para segurança profunda, observabilidade detalhada ou confiabilidade detalhada, salvo quando houver impacto direto na entrega e operação da infraestrutura.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar problemas que tornem o deploy imprevisível, a configuração insegura ou a operação inconsistente entre ambientes.
- Diferenciar claramente:
  - limitação operacional aceitável
  - fragilidade de configuração
  - risco de deploy
  - lacuna de integridade da cadeia de entrega

## Fases Oficiais da Run

### Fase 1 — Inventário de Ambientes, Runtime e Topologia de Deploy
#### Objetivo
Identificar onde e como o sistema roda, quais ambientes existem e qual é a topologia básica de entrega e execução.

#### Checks Obrigatórios
- identificar ambientes relevantes, como local, dev, test, staging, produção ou equivalentes
- identificar runtime principal do sistema
- identificar se o deploy usa containers, VMs, PaaS, serverless, Kubernetes ou combinação equivalente
- identificar artefatos principais de execução, como imagens, pacotes, bundles ou builds
- verificar se a topologia de deploy é minimamente compreensível
- verificar se há diferença relevante e pouco controlada entre ambientes

#### Evidências Esperadas
- arquivos de deploy
- compose, manifests, helm, workflows, scripts ou configs equivalentes
- documentação de ambientes
- Dockerfiles, manifests ou configs de runtime
- artefatos de pipeline e release
- referências a staging, produção e outros ambientes

#### Possíveis Achados
- topologia de deploy pouco clara
- ambientes mal definidos
- runtime confuso
- divergência relevante entre ambientes
- artefato de execução pouco rastreável
- deploy dependente de conhecimento tácito

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- onde o sistema roda
- quais ambientes existem
- como o deploy chega ao runtime

#### Condições de Bloqueio da Fase
- impossibilidade de identificar o ambiente de execução principal
- ausência de acesso suficiente aos artefatos de deploy
- inconsistência severa que impeça mapear a topologia mínima

---

### Fase 2 — Configuração, Env Vars e Segredos
#### Objetivo
Avaliar se a configuração do sistema está separada do código e se dados sensíveis são tratados de forma distinta da configuração comum.

#### Checks Obrigatórios
- verificar se configuração de ambiente está separada do código-fonte
- verificar se env vars, config services ou mecanismos equivalentes são usados de forma consistente
- verificar se segredos não estão hardcoded em código, imagem ou config pública
- verificar se configuração não sensível e segredos estão claramente separados
- verificar se templates de config, `.env.example` ou equivalentes ajudam sem expor valor sensível
- verificar se o sistema parece portável entre ambientes sem modificação de código
- verificar se mudanças de configuração são rastreáveis e controladas

#### Evidências Esperadas
- env files de exemplo
- config loaders
- manifests, values files, configmaps, secrets ou equivalentes
- pipelines com injeção de configuração
- documentação de variáveis e segredos
- código que consome configuração

#### Possíveis Achados
- configuração embutida no código
- segredo hardcoded
- mistura de segredo com config comum
- ambiente dependente de edição manual não controlada
- divergência de config entre ambientes sem disciplina
- template de configuração expondo dado sensível
- baixa portabilidade de configuração

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- separação entre código e configuração
- tratamento de segredos
- disciplina de configuração entre ambientes

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos artefatos de configuração
- impossibilidade de distinguir config de segredo
- conflito severo entre configuração declarada e consumo real pelo sistema

---

### Fase 3 — Build, Artefatos, Pipeline e Integridade da Cadeia de Entrega
#### Objetivo
Avaliar se o processo de build e geração de artefatos é controlado, rastreável e com postura mínima de integridade de supply chain.

#### Checks Obrigatórios
- verificar se o build é automatizado e reproduzível em grau razoável
- verificar se há pipeline CI/CD ou mecanismo equivalente de entrega
- verificar se artefatos, imagens ou pacotes têm origem rastreável
- verificar se o processo diferencia source, build e release de forma compreensível
- verificar se há controles mínimos para evitar mutação manual arbitrária de artefatos
- verificar se dependências de build e publicação parecem tratadas com higiene mínima
- verificar se o pipeline fornece evidência suficiente de como um artefato chegou à produção

#### Evidências Esperadas
- workflows CI/CD
- scripts de build/release
- Dockerfiles, build manifests ou configs equivalentes
- registries, package publishing ou storage de artefatos
- evidência de versionamento/tagging
- logs e estágios de pipeline, quando acessíveis

#### Possíveis Achados
- build manual demais
- pipeline pouco rastreável
- artefato sem origem clara
- mutação manual frequente de release
- baixa integridade da cadeia de entrega
- imagem ou pacote sem disciplina de versionamento
- dependência crítica de build pouco controlada
- baixa confiança sobre o que foi efetivamente implantado

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade do processo de build
- rastreabilidade de artefatos
- postura mínima de integridade da supply chain

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao pipeline ou aos artefatos
- impossibilidade de inferir como o build acontece
- inconsistência severa entre código, build e release observados

---

### Fase 4 — Estratégia de Deploy, Rollout e Rollback
#### Objetivo
Avaliar se o deploy acontece de forma controlada, com estratégia de rollout compreensível e capacidade realista de reversão.

#### Checks Obrigatórios
- verificar se existe estratégia clara de deploy
- verificar se rollout é controlado, gradual ou minimamente observável
- verificar se há rollback ou reversão prática quando necessário
- verificar se release, versionamento e promoção entre ambientes são compreensíveis
- verificar se mudanças em runtime e configuração entram no deploy de forma coordenada
- verificar se o processo de deploy evita intervenção manual excessiva em produção
- verificar se há proteção mínima contra deploy parcial ou inconsistente

#### Evidências Esperadas
- manifests de deploy
- workflows de release
- estratégias de rollout
- tags, versões, revisões ou release notes
- comandos/scripts de rollback quando existirem
- evidências de promoção entre ambientes

#### Possíveis Achados
- deploy imprevisível
- rollout não controlado
- rollback inexistente ou impraticável
- release sem versionamento claro
- deploy manual demais
- mudança de config fora do ciclo de entrega
- risco de estado inconsistente entre revisões

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- controle do processo de deploy
- capacidade de rollout seguro
- capacidade prática de rollback ou reversão

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao mecanismo de deploy
- impossibilidade de inferir como releases são promovidas
- conflito severo entre documentação, pipeline e runtime observado

---

### Fase 5 — Consistência entre Ambientes, Drift, Backup e Recuperação Operacional
#### Objetivo
Avaliar se os ambientes se mantêm coerentes, se mudanças manuais geram drift relevante e se existem bases mínimas para continuidade operacional via backup, restore ou mecanismos equivalentes quando aplicáveis.

#### Checks Obrigatórios
- verificar se ambientes importantes mantêm divergência controlada
- verificar se há sinais de drift por mudanças manuais frequentes
- verificar se infraestrutura e configuração são declarativas em grau razoável
- verificar se stores e componentes críticos possuem estratégia mínima de backup e restore quando aplicável
- verificar se o sistema consegue ser reconstruído ou reprovisionado com previsibilidade mínima
- verificar se quotas, limites, permissões ou bindings críticos são conhecidos e tratáveis
- verificar se a operação depende de correções manuais opacas para manter o sistema no ar

#### Evidências Esperadas
- manifests, templates ou IaC quando existirem
- documentação operacional
- scripts de provisionamento
- políticas ou sinais de backup/restore
- evidência de reconstrução de ambiente
- diferenças visíveis entre dev/staging/prod ou equivalentes

#### Possíveis Achados
- drift relevante entre ambientes
- ambiente não reprodutível
- dependência excessiva de ajuste manual
- backup/restore ausente onde seria esperado
- recuperação operacional fraca
- configuração crítica não declarativa
- comportamento imprevisível entre ambientes

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- consistência entre ambientes
- risco de drift
- prontidão mínima para recuperação operacional

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente aos artefatos de ambiente
- impossibilidade de inferir diferença entre ambientes
- conflito severo entre estado declarado e operação real observável

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de infraestrutura/deploy/config de achados cujo núcleo pertença a outro domínio
- destacar riscos prioritários de configuração, deploy e integridade de entrega

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- distinção entre limitação operacional, fragilidade de deploy e lacuna estrutural de configuração

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco crítico de entrega subavaliado

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
- risco crítico de deploy ou configuração mal resumido

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase
- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases
1. Inventário de Ambientes, Runtime e Topologia de Deploy
2. Configuração, Env Vars e Segredos
3. Build, Artefatos, Pipeline e Integridade da Cadeia de Entrega
4. Estratégia de Deploy, Rollout e Rollback
5. Consistência entre Ambientes, Drift, Backup e Recuperação Operacional
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
- conflito grave entre configuração, pipeline e comportamento real de entrega

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita infraestrutura de execução, deploy e configuração como disciplina operacional de entrega.
- Problemas profundos de segurança, observabilidade, confiabilidade, dados ou arquitetura devem ser tratados também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente previsibilidade de deploy, gestão de configuração ou integridade de entrega, ele pode ser citado aqui como impacto de infraestrutura/deploy/config, sem substituir a auditoria específica daquele domínio.

```


---

# Atualização obrigatória do status-geral.md

Ao final da execução:
- atualizar `/Auditoria/_framework/status-geral.md`
- marcar `status_playbooks_seed: completed` se todos os playbooks oficiais estiverem criados
- marcar `status_playbooks_seed: partial` se houver conflitos, faltas ou incompatibilidades
- atualizar `playbook_status` por domínio: `completed`, `partial` ou `pending`
- nunca zerar runs, histórico ou estados operacionais de domínio nesta etapa

# Atualização obrigatória do playbook-seed-report.md

Crie ou atualize `/Auditoria/_framework/playbook-seed-report.md` com:
- data_hora_execucao
- status_resultado: `completed` ou `partial`
- catálogo criado ou preservado
- lista de playbooks criados
- lista de playbooks preservados
- lista de playbooks completados
- conflitos encontrados
- resumo objetivo do seed

# Atualização opcional do checklist-global.md

Se `/Auditoria/_framework/checklist-global.md` possuir itens explícitos de playbooks/seed:
- marque somente os itens efetivamente concluídos nesta etapa
- não invente novos itens
- não altere itens do Bootstrap Core

# Regras finais de segurança do seed

1. Não alterar código-fonte do projeto auditado.
2. Não alterar testes da aplicação.
3. Não alterar infraestrutura do projeto real.
4. Não iniciar run.
5. Não finalizar run.
6. Não criar novos domínios.
7. Não criar playbooks extras fora dos 11 oficiais.
8. Não apagar histórico existente.
9. Não sobrescrever runs históricas.
10. Não rebaixar playbooks compatíveis já existentes.
11. Não resumir nem empobrecer o conteúdo canônico definido neste prompt.

# Critério de conclusão desta execução

Esta execução só pode ser encerrada quando:
1. o catálogo `index.md` estiver criado ou preservado de forma compatível
2. os 11 playbooks oficiais estiverem criados com o conteúdo canônico completo deste prompt
3. `/Auditoria/_framework/playbook-seed-report.md` estiver atualizado
4. `/Auditoria/_framework/status-geral.md` estiver atualizado
5. nenhum arquivo fora de `/Auditoria` tiver sido modificado

# Saída esperada ao encerrar

Ao terminar:
1. não iniciar run
2. não executar auditoria
3. não finalizar run
4. apenas registrar o seed concluído
5. encerrar
