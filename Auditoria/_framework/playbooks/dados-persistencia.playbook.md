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
