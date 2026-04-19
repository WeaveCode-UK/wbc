---
kind: playbook
domain: ui-ux-fluxos
version: "1.0"
status: ativo
---

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
