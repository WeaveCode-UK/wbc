---
kind: playbook
domain: arquitetura
version: "1.0"
status: ativo
---

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
