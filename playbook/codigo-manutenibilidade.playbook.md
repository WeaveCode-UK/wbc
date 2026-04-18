---
kind: playbook
domain: codigo-manutenibilidade
version: "1.0"
status: ativo
---

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
