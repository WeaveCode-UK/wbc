# Prompt 01A — Bootstrap Core do Framework de Auditoria

Você é um agente local operando diretamente no repositório.

Sua tarefa nesta execução é **somente** criar e inicializar o **Bootstrap Core** do framework de auditoria padronizado deste projeto.

# Objetivo

Criar, na raiz do repositório, a estrutura oficial do framework em `/Auditoria`, incluindo:

- estrutura de diretórios do core
- arquivos centrais do framework
- templates
- domínios oficiais
- arquivos `current/`
- arquivos `runs-index.md`
- pasta oficial de playbooks
- conteúdo inicial padronizado dos arquivos do core

Você **não deve** executar auditoria técnica do projeto nesta etapa.

Você **não deve** semear os playbooks completos nesta etapa.

---

# Regra máxima desta execução

Esta execução é **exclusivamente de Bootstrap Core**.

Você deve:

1. criar ou complementar a estrutura oficial do core do framework
2. preencher os arquivos-base do core
3. inicializar os templates
4. inicializar os domínios oficiais
5. criar a pasta oficial de playbooks
6. registrar o resultado em `/Auditoria/_framework/bootstrap-report.md`
7. deixar `/Auditoria/_framework/playbook-seed-report.md` preparado para a etapa 01B
8. inicializar `/Auditoria/_framework/status-geral.md`
9. encerrar

Você **não deve**:
- executar auditoria técnica de nenhum domínio
- iniciar run real
- finalizar run
- criar histórico de run finalizada
- gerar conteúdo completo dos 11 playbooks
- criar `/Auditoria/_framework/playbooks/index.md`
- criar arquivos `*.playbook.md`
- preencher achados técnicos reais
- modificar código-fonte do projeto fora de `/Auditoria`, salvo quando estritamente necessário para criar a própria pasta `/Auditoria`

---

# Idempotência e preservação obrigatórias

## Regra principal
Se o framework core já existir total ou parcialmente, **preserve** tudo que já estiver compatível e apenas complemente o que faltar.

## Regras específicas
1. Se um arquivo oficial já existir e estiver compatível com a função esperada, **não sobrescreva desnecessariamente**.
2. Se um arquivo oficial existir mas estiver claramente vazio, quebrado ou incompatível com a estrutura canônica, normalize com cuidado e registre isso em `/Auditoria/_framework/bootstrap-report.md`.
3. Se a pasta `/Auditoria/_framework/playbooks/` já existir com conteúdo, **não altere nem apague** arquivos existentes de playbook nesta etapa.
4. Se já existir material da etapa 01B, preserve-o.
5. Nunca apagar histórico existente em `runs/`.
6. Nunca sobrescrever runs históricas.
7. Nunca criar domínios duplicados.
8. Nunca renomear silenciosamente estruturas preexistentes sem registrar isso no report.

---

# Comportamento obrigatório antes de criar qualquer coisa

1. Verifique se já existe a pasta `/Auditoria` na raiz.
2. Se não existir, crie.
3. Se existir, inspecione cuidadosamente a estrutura existente antes de agir.
4. Se encontrar inconsistência estrutural grave com a convenção oficial, **não improvise correção silenciosa**.
5. Em caso de conflito relevante, registre o conflito em `/Auditoria/_framework/bootstrap-report.md` e preserve a estrutura existente o máximo possível sem criar duplicações desnecessárias.

## Exemplos de inconsistência relevante
- domínio oficial duplicado com grafia diferente
- múltiplas pastas equivalentes para o mesmo domínio
- `_framework` ausente, mas subestruturas parciais conflitantes
- arquivos oficiais com nomes diferentes da convenção
- coexistência de versões antigas e novas do core com conflito de papéis

Se houver conflito leve e facilmente tratável sem duplicação, normalize com cuidado e registre no report.

---

# Estrutura oficial do Bootstrap Core

Crie exatamente esta estrutura, sem gerar os arquivos completos dos playbooks nesta etapa:

/Auditoria
  /_framework
    framework.md
    convencoes.md
    lifecycle.md
    domains.md
    execution-rules.md
    state-machine.md
    glossario.md
    checklist-global.md
    status-geral.md
    bootstrap-report.md
    playbook-seed-report.md
    /templates
      metadata.template.md
      acompanhamento.template.md
      achados.template.md
      relatorio-final.template.md
      runs-index.template.md
    /playbooks

  /arquitetura
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /codigo-manutenibilidade
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /seguranca
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /apis-integracoes
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /dados-persistencia
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /performance-escalabilidade
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /confiabilidade-resiliencia
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /observabilidade-operacao
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /testes-qualidade
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /ui-ux-fluxos
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

  /infraestrutura-deploy-config
    runs-index.md
    /current
      metadata.md
      acompanhamento.md
      achados.md
      relatorio-final.md
    /runs

---

# Convenções obrigatórias

## Convenções de diretório
- usar somente letras minúsculas
- usar hífen para separar palavras
- não usar espaços
- não criar aliases ou variações dos domínios

## Convenção de idioma
- conteúdo textual em português técnico claro
- nomes de arquivos e diretórios fixos conforme especificação

## Convenção de run id
Formato oficial:
YYYY-MM-DD_HH-mm-ss

## Convenções de status de run
- not_started
- in_progress
- blocked
- ready_for_finalize
- completed
- archived

## Convenções de status de achado
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Convenções de severidade
- critico
- alto
- medio
- baixo
- informativo

---

# Conteúdo obrigatório dos arquivos centrais do core

Crie os arquivos abaixo com o conteúdo base exatamente alinhado a estas definições.

## 1. `/Auditoria/_framework/framework.md`

Conteúdo base:

# Framework de Auditoria de Projetos

## Objetivo
Este framework existe para permitir auditorias técnicas incrementais, rastreáveis e reutilizáveis em projetos de software de qualquer porte.

Seu propósito é:
- reduzir improviso durante auditorias
- evitar perda de contexto entre execuções
- permitir uso por modelos menores ou com contexto limitado
- registrar histórico técnico de forma persistida no próprio repositório
- apoiar a detecção de falhas de arquitetura, segurança, qualidade e operação

## Princípios do Framework
1. O estado oficial da auditoria deve estar em arquivos, não na memória da conversa.
2. Auditorias devem ser executadas em fases pequenas e controladas dentro de um domínio por vez.
3. Cada domínio de auditoria possui histórico próprio.
4. O framework deve funcionar em projetos novos, legados ou parcialmente incompletos.
5. O framework deve ser reutilizável entre diferentes projetos de software.
6. O framework possui duas etapas de setup:
   - Bootstrap Core
   - Seed de Playbooks

## Estrutura Oficial
A estrutura oficial do framework está sob `/Auditoria`.

### Núcleo do framework
- `/Auditoria/_framework`

### Domínios oficiais
- `/Auditoria/arquitetura`
- `/Auditoria/codigo-manutenibilidade`
- `/Auditoria/seguranca`
- `/Auditoria/apis-integracoes`
- `/Auditoria/dados-persistencia`
- `/Auditoria/performance-escalabilidade`
- `/Auditoria/confiabilidade-resiliencia`
- `/Auditoria/observabilidade-operacao`
- `/Auditoria/testes-qualidade`
- `/Auditoria/ui-ux-fluxos`
- `/Auditoria/infraestrutura-deploy-config`

### Playbooks
Os playbooks oficiais ficam em:
- `/Auditoria/_framework/playbooks/`

Eles são semeados na etapa 01B e definem:
- objetivo padrão da run
- escopo padrão da run
- fases internas do domínio
- checks obrigatórios
- critérios de bloqueio
- critérios para `ready_for_finalize`

## Estrutura por Domínio
Cada domínio contém:
- `runs-index.md`
- `current/`
- `runs/`

### `current/`
Área da run atual em andamento.

Contém:
- `metadata.md`
- `acompanhamento.md`
- `achados.md`
- `relatorio-final.md`

### `runs/`
Histórico das runs finalizadas.

### `runs-index.md`
Índice resumido das runs históricas do domínio.

## Ciclo Oficial
1. Bootstrap Core
2. Seed de Playbooks
3. Início de nova run
4. Execução da run orientada por playbook
5. Finalização e arquivamento da run

## Arquivos Centrais do Núcleo
- `framework.md`
- `convencoes.md`
- `lifecycle.md`
- `domains.md`
- `execution-rules.md`
- `state-machine.md`
- `glossario.md`
- `checklist-global.md`
- `status-geral.md`
- `bootstrap-report.md`
- `playbook-seed-report.md`

## Templates
Os templates oficiais ficam em:
- `/Auditoria/_framework/templates/`

Eles definem a estrutura inicial obrigatória dos arquivos operacionais.

## Regra de Autoridade
Em caso de conflito entre execução improvisada e documentação do framework, a documentação oficial do framework prevalece.

## Resultado Esperado
O framework deve permitir auditorias repetíveis, comparáveis ao longo do tempo e resistentes à perda de contexto.

---

## 2. `/Auditoria/_framework/convencoes.md`

Conteúdo base:

# Convenções do Framework de Auditoria

## Objetivo
Definir padrões fixos de nomenclatura, formatação e organização para evitar divergência estrutural entre execuções.

## Convenções de Diretórios
1. Todos os diretórios do framework devem usar letras minúsculas.
2. Usar hífen (`-`) para separar palavras quando necessário.
3. Não usar espaços em nomes de diretórios ou arquivos.
4. Não usar variações paralelas de um mesmo domínio.

## Convenções de Domínio
Os domínios oficiais são apenas os listados em `domains.md`.

Não criar:
- aliases
- abreviações não oficiais
- duplicatas com capitalização diferente
- novos domínios sem revisão da convenção oficial

## Convenções de Arquivos
Arquivos padronizados por domínio:
- `metadata.md`
- `acompanhamento.md`
- `achados.md`
- `relatorio-final.md`
- `runs-index.md`

Arquivos do núcleo:
- `framework.md`
- `convencoes.md`
- `lifecycle.md`
- `domains.md`
- `execution-rules.md`
- `state-machine.md`
- `glossario.md`
- `checklist-global.md`
- `status-geral.md`
- `bootstrap-report.md`
- `playbook-seed-report.md`

Arquivos de playbook:
- `index.md`
- `*.playbook.md`

## Convenção de Run ID
Formato oficial:
`YYYY-MM-DD_HH-mm-ss`

Exemplo:
`2026-03-22_20-15-00`

## Convenção de Idioma
1. O framework deve manter consistência de idioma.
2. Os nomes técnicos oficiais dos arquivos e diretórios permanecem fixos.
3. O conteúdo textual pode ser mantido em português técnico claro.

## Convenção de Status
### Status de run
- not_started
- in_progress
- blocked
- ready_for_finalize
- completed
- archived

### Status de achado
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

### Severidade
- critico
- alto
- medio
- baixo
- informativo

## Convenção de Timestamps
Quando necessário, usar:
`YYYY-MM-DD HH:mm:ss`

Exemplo:
`2026-03-22 20:15:00`

## Convenção de Ordem
1. Índices e históricos devem preferir ordem da run mais recente para a mais antiga.
2. Fases planejadas devem ser ordenadas numericamente.
3. Achados devem ser numerados sequencialmente:
   - `ACH-001`
   - `ACH-002`
   - `ACH-003`

## Convenção de Escrita
1. Usar linguagem objetiva.
2. Evitar texto excessivamente narrativo.
3. Não escrever opiniões vagas sem evidência.
4. Separar claramente:
   - evidência
   - impacto
   - recomendação
5. Sempre registrar próximo passo de forma explícita.

## Convenção de Integridade
1. Não sobrescrever histórico.
2. Não apagar runs antigas.
3. Não alterar manualmente a estrutura canônica sem revisão explícita do framework.
4. O Bootstrap Core não deve sobrescrever playbooks já semeados de forma compatível.
5. O Seed de Playbooks não deve alterar artefatos históricos de runs.

---

## 3. `/Auditoria/_framework/glossario.md`

Conteúdo base:

# Glossário do Framework de Auditoria

## auditoria
Processo estruturado de avaliação técnica de um domínio específico do projeto.

## dominio
Área temática oficial de auditoria, como arquitetura, segurança ou performance.

## run
Instância específica de execução de uma auditoria em um domínio.

## run_id
Identificador único de uma run, baseado em data e hora.

## current
Área operacional da run atual em andamento dentro de um domínio.

## runs
Histórico das runs finalizadas de um domínio.

## runs-index
Arquivo resumido que lista as runs concluídas de um domínio.

## metadata
Arquivo que controla o estado formal da run.

## acompanhamento
Arquivo que registra histórico operacional da execução da run.

## achado
Problema, risco, inconsistência ou observação relevante identificada durante a auditoria.

## relatorio-final
Síntese consolidada da run, com resumo executivo, riscos e recomendações.

## bootstrap core
Etapa inicial que cria a estrutura-base do framework, seus templates, domínios e arquivos centrais.

## seed de playbooks
Etapa que cria e preenche o índice oficial dos playbooks e os playbooks canônicos dos domínios.

## playbook
Documento canônico que define como uma run de um domínio deve ser inicializada e executada.

## fase
Etapa lógica de uma auditoria dentro de uma run.

## lote
Subconjunto pequeno de trabalho dentro de uma fase.

## escopo
Limite do que a run pretende cobrir.

## bloqueio
Impedimento que interrompe a progressão normal da run.

## evidência
Base concreta observável no repositório que sustenta um achado.

## severidade
Classificação de gravidade de um achado.

## consolidacao
Etapa de revisão dos achados e preparação do relatório final.

## finalizacao
Etapa em que a run é arquivada no histórico e o `current/` é reinicializado.

## reauditoria
Nova run aberta futuramente para reavaliar um domínio já auditado antes.

## nao_aplicavel
Marca usada quando uma fase, verificação ou critério não faz sentido para o projeto ou domínio em questão, desde que haja justificativa.

## status-geral
Arquivo central que resume a situação do framework e dos domínios.

## maquina de estados
Conjunto de estados permitidos e transições válidas para runs do framework.

---

## 4. `/Auditoria/_framework/execution-rules.md`

Conteúdo base:

# Regras de Execução do Framework de Auditoria

## Objetivo
Garantir que qualquer agente execute auditorias de forma incremental, rastreável, previsível e sem pular etapas.

## Princípios Obrigatórios
1. Executar apenas dentro da estrutura oficial do framework.
2. Nunca improvisar novas pastas, domínios ou arquivos fora da convenção definida.
3. Nunca executar uma auditoria inteira em uma única rodada se ela puder ser dividida em fases ou lotes.
4. Toda execução deve deixar evidência persistida em arquivo antes de terminar.
5. Toda execução deve terminar com um próximo passo explícito.
6. Toda fase deve ser concluída, bloqueada ou marcada como não aplicável com justificativa.
7. Não confiar em memória conversacional como fonte de verdade; usar os arquivos do framework como estado oficial.
8. Nenhuma run pode ser iniciada antes do Seed de Playbooks correspondente.
9. O Prompt 02 deve sempre inicializar a run a partir de um playbook oficial.
10. O Prompt 03 deve sempre executar a run com base no playbook do domínio aberto.

## Regras Estruturais
1. Somente o Bootstrap Core pode criar a estrutura-base do framework.
2. Somente o Seed de Playbooks pode criar o índice oficial dos playbooks e os arquivos `*.playbook.md`.
3. Prompts de auditoria não podem criar novos domínios.
4. Cada domínio possui uma única área `current/` para run em andamento.
5. Runs históricas só podem existir em `runs/`.
6. `runs-index.md` deve ser atualizado apenas no encerramento bem-sucedido da run.

## Regras de Escopo
1. Executar apenas o domínio solicitado.
2. Executar apenas a fase ou lote atual da run aberta.
3. Não expandir automaticamente o escopo para outros domínios.
4. Não repetir fases já concluídas, salvo quando houver justificativa explícita de reauditoria.
5. Se a fase atual for grande demais, quebrá-la em lotes menores e registrar essa decisão.

## Regras de Ordem
1. Ler primeiro:
   - `/Auditoria/_framework/framework.md`
   - `/Auditoria/_framework/convencoes.md`
   - `/Auditoria/_framework/lifecycle.md`
   - `/Auditoria/_framework/execution-rules.md`
   - `/Auditoria/_framework/state-machine.md`
2. Ler depois os arquivos do domínio atual:
   - `/Auditoria/<dominio>/runs-index.md`
   - `/Auditoria/<dominio>/current/metadata.md`
   - `/Auditoria/<dominio>/current/acompanhamento.md`
   - `/Auditoria/<dominio>/current/achados.md`
   - `/Auditoria/<dominio>/current/relatorio-final.md`
3. Em Prompt 02 e Prompt 03, ler também:
   - `/Auditoria/_framework/playbooks/index.md`
   - `/Auditoria/_framework/playbooks/<dominio>.playbook.md`
4. Só então executar a ação da rodada.
5. Antes de encerrar, persistir as atualizações necessárias.

## Regras de Persistência
1. Se houve mudança de estado da run, atualizar `metadata.md`.
2. Se houve execução de lote ou fase, atualizar `acompanhamento.md`.
3. Se houve descoberta técnica relevante, atualizar `achados.md`.
4. Se houve consolidação parcial ou final, atualizar `relatorio-final.md`.
5. Se houve finalização da run, atualizar `runs-index.md` e `status-geral.md`.

## Regras de Progresso
1. Nunca marcar fase como concluída sem evidência mínima.
2. Nunca avançar de fase sem registrar o resultado da fase anterior.
3. Nunca deixar o campo `Proximo Passo Obrigatorio` indefinido.
4. Nunca deixar bloqueio sem registro.
5. Se a fase não for aplicável, registrar `nao_aplicavel` com justificativa objetiva.

## Regras de Achados
1. Todo achado confirmado deve conter evidência.
2. Achado sem evidência só pode ser registrado como hipótese ou limitação.
3. Toda severidade deve seguir a escala oficial:
   - critico
   - alto
   - medio
   - baixo
   - informativo
4. O relatório final deve refletir os achados registrados.

## Regras de Finalização
1. Uma run em `current/` só pode ir para finalização quando estiver em `ready_for_finalize`.
2. Runs finalizadas devem ser copiadas para `runs/<run_id>/`.
3. Apenas após cópia íntegra o `current/` pode ser reinicializado.
4. O encerramento deve atualizar:
   - `/Auditoria/_framework/status-geral.md`
   - `/Auditoria/<dominio>/runs-index.md`

## Regras de Segurança Operacional do Próprio Framework
1. Nunca apagar histórico existente em `runs/`.
2. Nunca sobrescrever uma run histórica.
3. Nunca duplicar entradas no `runs-index.md`.
4. Em caso de inconsistência estrutural, parar e registrar conflito em vez de improvisar correção.

## Regra de Parada
Toda execução deve terminar quando uma destas condições ocorrer:
1. O lote atual foi concluído e persistido.
2. Foi encontrado bloqueio que impede progresso.
3. Foi detectada inconsistência estrutural no framework.
4. A fase atual precisa ser quebrada em subtarefas antes de continuar.

## Resultado Esperado de Cada Execução
Toda execução deve produzir, no mínimo:
1. estado atualizado
2. histórico atualizado
3. próximo passo obrigatório definido

---

## 5. `/Auditoria/_framework/state-machine.md`

Conteúdo base:

# Máquina de Estados das Runs de Auditoria

## Objetivo
Definir os estados válidos de uma run de auditoria e as transições permitidas.

## Estados Oficiais
- not_started
- in_progress
- blocked
- ready_for_finalize
- completed
- archived

## Definição dos Estados

### not_started
A run ainda não foi iniciada formalmente.
Condição típica:
- `current/` existe
- ainda não há `run_id` ativo real
- nenhum trabalho de auditoria foi executado para a run atual

### in_progress
A run foi iniciada e está em execução ativa.
Condição típica:
- há `run_id`
- há escopo definido
- há pelo menos uma fase planejada
- a run foi inicializada a partir de um playbook oficial
- execução em andamento

### blocked
A run está temporariamente impedida de prosseguir.
Condição típica:
- existe impedimento técnico, estrutural ou contextual
- o bloqueio foi registrado em `acompanhamento.md`

### ready_for_finalize
A run concluiu seu trabalho aplicável e está pronta para arquivamento.
Condição típica:
- fases executáveis concluídas
- achados consolidados
- relatório final preenchido
- sem pendência crítica aberta para fechamento

### completed
A run foi concluída formalmente e registrada no histórico.
Condição típica:
- conteúdo final copiado para `runs/<run_id>/`
- indexadores atualizados

### archived
Estado histórico opcional para indicar que a run já está definitivamente encerrada e apenas preservada no histórico.
Na prática, uma run histórica concluída pode ser tratada como `completed`, e `archived` pode ser usado apenas se houver política futura específica.

## Transições Permitidas

### De `not_started`
Pode ir para:
- `in_progress`

### De `in_progress`
Pode ir para:
- `blocked`
- `ready_for_finalize`

### De `blocked`
Pode ir para:
- `in_progress`
- `ready_for_finalize` (somente se o bloqueio foi resolvido e a run já estava materialmente concluída)

### De `ready_for_finalize`
Pode ir para:
- `completed`

Pode voltar para:
- `in_progress` (somente se for reaberta antes da finalização por necessidade justificada)

### De `completed`
Pode ir para:
- `archived` (se essa política for utilizada)

### De `archived`
Estado terminal.
Não possui transição de retorno.

## Regras de Transição
1. Toda mudança de estado deve ser registrada em `current/metadata.md`.
2. Toda mudança relevante deve ser refletida em `current/acompanhamento.md`.
3. Uma run não pode ser marcada como `ready_for_finalize` sem:
   - escopo executado ou justificado
   - achados consolidados
   - relatório final preenchido
   - execução orientada por playbook oficial
4. Uma run não pode ser marcada como `completed` enquanto ainda estiver apenas em `current/`.
5. O estado `completed` pertence ao registro histórico final da run.
6. Em `current/`, o estado operacional preferencial máximo é `ready_for_finalize`.

## Regras para Bloqueio
1. `blocked` exige descrição explícita do impedimento.
2. `blocked` exige próximo passo ou condição de desbloqueio.
3. O bloqueio não autoriza pular a fase; apenas interrompe temporariamente.

## Regras para Reabertura
1. Uma run em `current/ready_for_finalize` pode retornar para `in_progress` se houver erro de consolidação ou necessidade justificada.
2. Uma run já `completed` não deve ser reaberta; uma nova auditoria deve gerar nova run.

## Resultado Esperado
Toda run deve seguir esta máquina de estados sem criar estados alternativos.

---

## 6. `/Auditoria/_framework/lifecycle.md`

Conteúdo base:

# Ciclo de Vida Oficial das Auditorias

## Objetivo
Definir o processo oficial de criação, execução, finalização e histórico das auditorias do framework.

## Visão Geral do Ciclo
O ciclo oficial do framework é:

1. Bootstrap Core
2. Seed de Playbooks
3. Início de uma nova run
4. Execução da run orientada por playbook
5. Finalização e arquivamento da run

---

## Etapa 1 — Bootstrap Core

### Objetivo
Preparar a estrutura oficial do framework dentro do projeto.

### Responsabilidades
- criar `/Auditoria`
- criar `/_framework`
- criar templates
- criar domínios oficiais
- criar `current/`, `runs/` e `runs-index.md`
- criar pasta de playbooks
- inicializar documentação-base do core
- registrar `/Auditoria/_framework/bootstrap-report.md`
- preparar `/Auditoria/_framework/playbook-seed-report.md`

### Resultado Esperado
O framework core fica pronto para receber o Seed de Playbooks sem improvisação estrutural.

### Observação
O Bootstrap Core não executa auditoria técnica do projeto e não semeia os playbooks completos.

---

## Etapa 2 — Seed de Playbooks

### Objetivo
Criar e preencher o índice oficial dos playbooks e os 11 playbooks canônicos do framework.

### Pré-condições
- Bootstrap Core concluído
- pasta `/Auditoria/_framework/playbooks/` existente
- estrutura dos domínios oficiais existente

### Ações Esperadas
- criar `/Auditoria/_framework/playbooks/index.md`
- criar os arquivos `*.playbook.md`
- registrar o resultado em `/Auditoria/_framework/playbook-seed-report.md`
- atualizar `/Auditoria/_framework/checklist-global.md`
- atualizar `/Auditoria/_framework/status-geral.md`

### Resultado Esperado
O framework fica apto a iniciar runs orientadas por playbook.

---

## Etapa 3 — Início de Nova Run

### Objetivo
Abrir formalmente uma nova run para um domínio específico.

### Pré-condições
- Bootstrap Core concluído
- Seed de Playbooks concluído
- domínio oficial existente
- playbook oficial existente para o domínio
- inexistência de conflito estrutural
- `current/` em estado utilizável

### Ações Esperadas
- selecionar um domínio oficial
- localizar o playbook correspondente
- gerar ou definir `run_id`
- atualizar `current/metadata.md`
- atualizar `current/acompanhamento.md`
- inicializar a run com base no playbook
- marcar status como `in_progress`

### Resultado Esperado
Existe uma run ativa formalmente iniciada no domínio escolhido, com objetivo, escopo e fases vindos do playbook oficial.

---

## Etapa 4 — Execução da Run Orientada por Playbook

### Objetivo
Executar a run em fases pequenas, controladas e persistidas, usando como fonte de verdade o playbook do domínio aberto.

### Regras
- uma fase ou lote por vez
- sem salto de fases
- registrar histórico ao final de cada rodada
- registrar achados conforme forem confirmados
- manter próximo passo obrigatório definido
- usar o playbook oficial como referência de escopo e fases

### Arquivos Atualizados
- `current/metadata.md` quando houver mudança de estado
- `current/acompanhamento.md` ao final de cada lote
- `current/achados.md` quando houver novos achados
- `current/relatorio-final.md` quando houver consolidação relevante

### Resultado Esperado
A run avança de forma incremental, auditável e aderente ao playbook do domínio.

---

## Etapa 5 — Finalização e Arquivamento

### Objetivo
Encerrar formalmente a run e movê-la para o histórico do domínio.

### Pré-condições
- status em `ready_for_finalize`
- arquivos finais consistentes
- `run_id` válido

### Ações Esperadas
1. criar pasta `runs/<run_id>/`
2. copiar para essa pasta:
   - `metadata.md`
   - `acompanhamento.md`
   - `achados.md`
   - `relatorio-final.md`
3. validar integridade da cópia
4. atualizar `runs-index.md`
5. atualizar `/Auditoria/_framework/status-geral.md`
6. reinicializar `current/` com base nos templates
7. deixar `current/metadata.md` em `not_started`

### Resultado Esperado
A run fica preservada no histórico e o domínio volta a ficar pronto para uma nova run futura.

---

## Regra de Ouro do Ciclo
Nenhuma auditoria deve depender da memória da conversa como fonte principal de estado.
O estado oficial da auditoria é sempre o que está persistido nos arquivos do framework.

---

## 7. `/Auditoria/_framework/domains.md`

Crie este arquivo com o conteúdo abaixo:

# Domínios Oficiais do Framework de Auditoria

## 1. arquitetura
- Objetivo: verificar se a arquitetura declarada e a arquitetura implementada estão coerentes.
- Aplicabilidade: qualquer projeto de software.
- Cobre: módulos, camadas, boundaries, acoplamento, coesão, dependências cruzadas, padrão arquitetural real.
- Não cobre diretamente: segurança detalhada, performance detalhada, infraestrutura.

## 2. codigo-manutenibilidade
- Objetivo: verificar a saúde do código para evolução e manutenção.
- Aplicabilidade: qualquer projeto com código-fonte.
- Cobre: legibilidade, complexidade, duplicação, smells, clareza estrutural, dívida técnica visível.
- Não cobre diretamente: arquitetura macro, observabilidade, deploy.

## 3. seguranca
- Objetivo: verificar riscos de exploração, exposição indevida e falhas de proteção.
- Aplicabilidade: qualquer projeto executável, especialmente com rede, autenticação, dados ou usuários.
- Cobre: auth, authz, validação, injection, XSS, CSRF, SSRF, secrets, uploads, headers, rate limit, tokens, webhooks inseguros.
- Não cobre diretamente: performance, UX, modelagem de domínio.

## 4. apis-integracoes
- Objetivo: verificar consistência e robustez das superfícies de integração.
- Aplicabilidade: projetos com API, webhooks ou dependências externas.
- Cobre: rotas, contratos, versionamento, status codes, idempotência, paginação, retries, timeouts, integrações externas.
- Não cobre diretamente: segurança profunda de credenciais, UX de interface.

## 5. dados-persistencia
- Objetivo: verificar a qualidade estrutural e operacional da camada de dados.
- Aplicabilidade: projetos com banco, storage ou persistência relevante.
- Cobre: modelagem, schema, constraints, índices, migrations, integridade, concorrência, consistência transacional, queries.
- Não cobre diretamente: UX, observabilidade global, deploy.

## 6. performance-escalabilidade
- Objetivo: verificar eficiência e capacidade de crescimento do sistema.
- Aplicabilidade: qualquer projeto que execute carga real.
- Cobre: gargalos, N+1, payloads, cache, filas, throughput, hotspots, renderizações desnecessárias.
- Não cobre diretamente: segurança, qualidade visual da interface.

## 7. confiabilidade-resiliencia
- Objetivo: verificar comportamento do sistema sob erro, falha externa e concorrência.
- Aplicabilidade: qualquer projeto com integrações, jobs, paralelismo ou processamento assíncrono.
- Cobre: retries, backoff, timeouts, idempotência operacional, race conditions, duplicidade, recuperação.
- Não cobre diretamente: estética de UI, modelagem de código em si.

## 8. observabilidade-operacao
- Objetivo: verificar capacidade de observação, diagnóstico e operação do sistema.
- Aplicabilidade: qualquer projeto com ambiente de execução real.
- Cobre: logs, métricas, tracing, alertas, health checks, readiness, visibilidade de falhas.
- Não cobre diretamente: UX, regras de negócio, arquitetura lógica.

## 9. testes-qualidade
- Objetivo: verificar a proteção contra regressões e a robustez da validação automatizada.
- Aplicabilidade: qualquer projeto em evolução.
- Cobre: unit, integration, e2e, cobertura útil, lacunas críticas, fragilidade dos testes, gates.
- Não cobre diretamente: infraestrutura em produção, UX visual.

## 10. ui-ux-fluxos
- Objetivo: verificar integridade funcional e qualidade de experiência da interface.
- Aplicabilidade: projetos com frontend, app ou interface administrativa.
- Cobre: telas conectadas, estados, feedback visual, responsividade, acessibilidade básica, fluxos ponta a ponta.
- Não cobre diretamente: backend security profunda, modelagem de banco.

## 11. infraestrutura-deploy-config
- Objetivo: verificar readiness operacional e segurança da configuração de execução.
- Aplicabilidade: qualquer projeto que rode fora do editor local.
- Cobre: env vars, CI/CD, deploy, containers, secrets, rollback, ambientes, backups quando aplicável.
- Não cobre diretamente: UX, arquitetura de domínio, qualidade semântica do código.

---

## 8. `/Auditoria/_framework/checklist-global.md`

Conteúdo base:

# Checklist Global do Framework

## Objetivo
Garantir que a estrutura do framework foi criada corretamente e que está pronta para uso operacional.

## Estrutura Base do Core
- [ ] Pasta `/Auditoria` criada
- [ ] Pasta `/Auditoria/_framework` criada
- [ ] Pasta `/Auditoria/_framework/templates` criada
- [ ] Pasta `/Auditoria/_framework/playbooks` criada

## Arquivos do Núcleo
- [ ] `framework.md` criado
- [ ] `convencoes.md` criado
- [ ] `lifecycle.md` criado
- [ ] `domains.md` criado
- [ ] `execution-rules.md` criado
- [ ] `state-machine.md` criado
- [ ] `glossario.md` criado
- [ ] `checklist-global.md` criado
- [ ] `status-geral.md` criado
- [ ] `bootstrap-report.md` criado
- [ ] `playbook-seed-report.md` criado

## Templates
- [ ] `metadata.template.md` criado
- [ ] `acompanhamento.template.md` criado
- [ ] `achados.template.md` criado
- [ ] `relatorio-final.template.md` criado
- [ ] `runs-index.template.md` criado

## Domínios Oficiais
- [ ] `arquitetura` criado
- [ ] `codigo-manutenibilidade` criado
- [ ] `seguranca` criado
- [ ] `apis-integracoes` criado
- [ ] `dados-persistencia` criado
- [ ] `performance-escalabilidade` criado
- [ ] `confiabilidade-resiliencia` criado
- [ ] `observabilidade-operacao` criado
- [ ] `testes-qualidade` criado
- [ ] `ui-ux-fluxos` criado
- [ ] `infraestrutura-deploy-config` criado

## Estrutura por Domínio
Para cada domínio:
- [ ] `runs-index.md` criado
- [ ] `current/` criado
- [ ] `runs/` criado
- [ ] `current/metadata.md` criado
- [ ] `current/acompanhamento.md` criado
- [ ] `current/achados.md` criado
- [ ] `current/relatorio-final.md` criado

## Seed de Playbooks
- [ ] `/Auditoria/_framework/playbooks/index.md` criado
- [ ] `arquitetura.playbook.md` criado
- [ ] `codigo-manutenibilidade.playbook.md` criado
- [ ] `seguranca.playbook.md` criado
- [ ] `apis-integracoes.playbook.md` criado
- [ ] `dados-persistencia.playbook.md` criado
- [ ] `performance-escalabilidade.playbook.md` criado
- [ ] `confiabilidade-resiliencia.playbook.md` criado
- [ ] `observabilidade-operacao.playbook.md` criado
- [ ] `testes-qualidade.playbook.md` criado
- [ ] `ui-ux-fluxos.playbook.md` criado
- [ ] `infraestrutura-deploy-config.playbook.md` criado

## Prontidão Operacional
- [ ] Convenções revisadas
- [ ] Máquina de estados definida
- [ ] Regras de execução definidas
- [ ] Lifecycle definido
- [ ] Status global inicializado
- [ ] Bootstrap Core report preenchido
- [ ] Seed de playbooks concluído

## Resultado Esperado
O framework só estará pronto para iniciar runs reais quando:
- o Bootstrap Core estiver concluído
- o Seed de Playbooks estiver concluído
- os itens aplicáveis estiverem marcados

---

## 9. `/Auditoria/_framework/status-geral.md`

Conteúdo base:

# Status Geral do Framework

## Identificação
- ultima_atualizacao: none
- versao_framework: 2.0
- status_bootstrap_core: pending
- status_playbooks_seed: pending

## Resumo Geral
- total_dominios: 11
- total_playbooks_oficiais: 11
- dominios_com_run_ativa: 0
- dominios_com_historico: 0
- total_runs_historicas: 0

## Status por Domínio

### arquitetura
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### codigo-manutenibilidade
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### seguranca
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### apis-integracoes
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### dados-persistencia
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### performance-escalabilidade
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### confiabilidade-resiliencia
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### observabilidade-operacao
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### testes-qualidade
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### ui-ux-fluxos
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

### infraestrutura-deploy-config
- status_current: not_started
- run_id_atual: none
- ultima_run_finalizada: none
- total_runs: 0
- playbook_status: pending

## Regras de Atualização
1. Atualizar este arquivo no Bootstrap Core.
2. Atualizar este arquivo no Seed de Playbooks.
3. Atualizar este arquivo ao iniciar uma run.
4. Atualizar este arquivo ao finalizar uma run.
5. Não usar este arquivo para registrar achados técnicos detalhados.

## Objetivo
Permitir visão rápida do estado do framework sem precisar abrir cada domínio individualmente.

---

## 10. `/Auditoria/_framework/bootstrap-report.md`

Conteúdo base:

# Bootstrap Core Report do Framework de Auditoria

## Identificação
- data_hora_execucao: none
- versao_framework: 2.0
- status_resultado: pending

## Objetivo
Registrar o resultado da execução do Bootstrap Core que criou ou inicializou a estrutura principal do framework no projeto.

## Estrutura Criada
- pasta `/Auditoria`: nao_registrado
- pasta `/Auditoria/_framework`: nao_registrado
- pasta `/Auditoria/_framework/templates`: nao_registrado
- pasta `/Auditoria/_framework/playbooks`: nao_registrado

## Arquivos do Núcleo
- framework.md: nao_registrado
- convencoes.md: nao_registrado
- lifecycle.md: nao_registrado
- domains.md: nao_registrado
- execution-rules.md: nao_registrado
- state-machine.md: nao_registrado
- glossario.md: nao_registrado
- checklist-global.md: nao_registrado
- status-geral.md: nao_registrado
- bootstrap-report.md: nao_registrado
- playbook-seed-report.md: nao_registrado

## Templates
- metadata.template.md: nao_registrado
- acompanhamento.template.md: nao_registrado
- achados.template.md: nao_registrado
- relatorio-final.template.md: nao_registrado
- runs-index.template.md: nao_registrado

## Domínios Inicializados
- arquitetura: nao_registrado
- codigo-manutenibilidade: nao_registrado
- seguranca: nao_registrado
- apis-integracoes: nao_registrado
- dados-persistencia: nao_registrado
- performance-escalabilidade: nao_registrado
- confiabilidade-resiliencia: nao_registrado
- observabilidade-operacao: nao_registrado
- testes-qualidade: nao_registrado
- ui-ux-fluxos: nao_registrado
- infraestrutura-deploy-config: nao_registrado

## Seed de Playbooks
- status: pending
- observacao: esta etapa nao cria os playbooks canônicos nem o index oficial

## Conflitos ou Inconsistências Detectadas
- none

## Resumo Final
- none

## Resultado Esperado
Ao final do Bootstrap Core, este arquivo deve deixar claro:
- o que foi criado
- o que já existia
- se houve conflito
- se o core ficou pronto para o Seed de Playbooks

---

## 11. `/Auditoria/_framework/playbook-seed-report.md`

Conteúdo base:

# Playbook Seed Report do Framework de Auditoria

## Identificação
- data_hora_execucao: none
- versao_framework: 2.0
- status_resultado: pending

## Objetivo
Registrar o resultado da etapa de Seed de Playbooks que criará o índice oficial e os 11 playbooks canônicos do framework.

## Estrutura Esperada do Seed
- `/Auditoria/_framework/playbooks/index.md`
- 11 arquivos `*.playbook.md`

## Status Atual
- seed_executado: nao
- total_playbooks_criados: 0
- total_playbooks_esperados: 11

## Observacoes
- none

## Resultado Esperado
Ao final do Seed de Playbooks, este arquivo deve deixar claro:
- quais playbooks foram criados
- se houve conflito
- se o framework ficou pronto para iniciar runs reais

---

# Conteúdo obrigatório dos templates

Crie os templates oficiais abaixo.

## 12. `/Auditoria/_framework/templates/metadata.template.md`

Conteúdo base:

# Metadata da Run Atual

- dominio: {{DOMINIO}}
- run_id: none
- status: not_started
- iniciado_em: none
- finalizado_em: none
- escopo: none
- origem: bootstrap-core
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: none
- observacoes: current inicial criado pelo bootstrap core

## Estados Permitidos
- not_started
- in_progress
- blocked
- ready_for_finalize
- completed
- archived

## Regras
- Não alterar o domínio.
- Não inventar novos status.
- Não marcar `completed` nesta área de `current`.
- `completed` e `archived` são estados históricos e devem existir apenas em runs finalizadas.
- Enquanto a run estiver em `current`, os estados válidos práticos são:
  - not_started
  - in_progress
  - blocked
  - ready_for_finalize

## Atualização Esperada
Atualize este arquivo apenas quando houver mudança real de estado da run.
Não use este arquivo para registrar achados técnicos ou histórico detalhado de execução.

---

## 13. `/Auditoria/_framework/templates/acompanhamento.template.md`

Conteúdo base:

# Acompanhamento da Auditoria

## Identificação
- dominio: {{DOMINIO}}
- run_id: none
- status_atual: not_started
- ultima_atualizacao: none

## Objetivo da Run
Descrever de forma curta o objetivo desta run de auditoria para o domínio atual.

## Escopo Planejado
Listar as fases planejadas desta auditoria de forma objetiva e ordenada.

Exemplo:
1. Fase 1 do playbook
2. Fase 2 do playbook
3. Consolidação de achados
4. Preparação para finalização

## Fase Atual
- fase_atual: none
- lote_atual: none
- descricao_lote_atual: none

## Progresso Geral
- [ ] Run iniciada
- [ ] Escopo definido
- [ ] Fases executadas
- [ ] Achados consolidados
- [ ] Run pronta para finalização

## Regras de Execução
- Executar apenas uma fase ou um lote pequeno por vez.
- Não pular fases pendentes sem registrar justificativa.
- Não marcar etapa como concluída sem evidência mínima no histórico.
- Sempre atualizar este arquivo ao final de cada execução.
- Se houver bloqueio, registrar em `Bloqueios e Impedimentos`.
- Ao concluir o lote atual, definir explicitamente o próximo passo.

## Histórico de Execuções

### Execução 000
- data_hora: none
- objetivo: inicializacao via bootstrap core
- status_resultado: pending
- arquivos_ou_areas_analisadas:
  - none
- acoes_realizadas:
  - estrutura current inicial criada
- achados_resumidos:
  - none
- bloqueios:
  - none
- proximo_passo_obrigatorio:
  - aguardar seed de playbooks e inicio formal da run

## Achados Relacionados Nesta Run
Referenciar de forma resumida os principais achados registrados em `achados.md`.

- nenhum ate o momento

## Bloqueios e Impedimentos
Registrar aqui qualquer impedimento que impeça a continuidade normal.

- nenhum ate o momento

## Proximo Passo Obrigatorio
Descrever exatamente a próxima ação que o agente deve executar.
Este campo nunca deve ficar ambíguo.

- aguardar seed de playbooks e inicio formal da run

## Critério para Marcar `ready_for_finalize`
A run só pode ser marcada como `ready_for_finalize` quando:
- todas as fases planejadas aplicáveis estiverem concluídas ou justificadamente marcadas como não aplicáveis
- os achados estiverem consolidados em `achados.md`
- o `relatorio-final.md` estiver preenchido em versão final da run
- não houver bloqueios abertos sem registro de decisão

---

## 14. `/Auditoria/_framework/templates/achados.template.md`

Conteúdo base:

# Achados da Auditoria

## Identificação
- dominio: {{DOMINIO}}
- run_id: none
- ultima_atualizacao: none

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve pertencer a uma categoria compatível com o domínio atual.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese e explicar a limitação.

## Severidades Permitidas
- critico
- alto
- medio
- baixo
- informativo

## Status Permitidos
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Estrutura Padrão do Achado

### ACH-001
- titulo: none
- severidade: informativo
- categoria: none
- status: aberto
- resumo: none

#### Evidencia
- arquivo_ou_area: none
- detalhe: none

#### Impacto
- tecnico: none
- negocio: none

#### Recomendacao
- acao_sugerida: none
- prioridade: none

#### Observacoes
- none

---

## Achados Registrados
Nenhum achado registrado ate o momento.

---

## 15. `/Auditoria/_framework/templates/relatorio-final.template.md`

Conteúdo base:

# Relatório Final da Auditoria

## Identificação
- dominio: {{DOMINIO}}
- run_id: none
- status_run: none
- iniciado_em: none
- finalizado_em: none
- ultima_atualizacao: none

## Objetivo da Run
Descrever em 1 a 3 linhas o objetivo desta auditoria.

## Escopo Executado
Listar o que foi efetivamente coberto nesta run.

- none

## Escopo Nao Coberto ou Parcial
Listar o que ficou fora, parcial ou bloqueado, com justificativa curta.

- none

## Resumo Executivo
Descrever em linguagem clara a situacao geral encontrada no dominio auditado.

- none

## Principais Achados
Listar os achados mais relevantes desta run.

1. none
2. none
3. none

## Distribuicao por Severidade
- critico: 0
- alto: 0
- medio: 0
- baixo: 0
- informativo: 0

## Riscos Prioritarios
Listar os riscos que exigem atencao mais urgente.

- none

## Recomendacoes Prioritarias
Listar as acoes recomendadas em ordem objetiva.

1. none
2. none
3. none

## Avaliacao Geral do Dominio
Escolher uma avaliacao final coerente com os achados.

- avaliacao: none

Valores sugeridos:
- adequado
- aceitavel_com_ressalvas
- preocupante
- critico

## Prontidao para Encerramento
- pronto_para_finalizar: nao
- justificativa: none

## Observacoes Finais
- none

---

## 16. `/Auditoria/_framework/templates/runs-index.template.md`

Conteúdo base:

# Índice de Runs do Domínio

## Identificação
- dominio: {{DOMINIO}}
- ultima_atualizacao: none
- total_runs_registradas: 0

## Regras
- Registrar apenas runs finalizadas.
- Ordenar da mais recente para a mais antiga.
- Cada run deve aparecer uma única vez.
- Cada entrada deve resumir status, escopo, resultado e severidade agregada.

## Runs Registradas
Nenhuma run finalizada registrada ate o momento.

---

# Inicialização dos domínios

Para cada domínio oficial:

1. criar `runs-index.md` com base no template `runs-index.template.md`, substituindo `{{DOMINIO}}`
2. criar `current/metadata.md` com base em `metadata.template.md`, substituindo `{{DOMINIO}}`
3. criar `current/acompanhamento.md` com base em `acompanhamento.template.md`, substituindo `{{DOMINIO}}`
4. criar `current/achados.md` com base em `achados.template.md`, substituindo `{{DOMINIO}}`
5. criar `current/relatorio-final.md` com base em `relatorio-final.template.md`, substituindo `{{DOMINIO}}`
6. criar `runs/` vazio

Domínios oficiais:
- arquitetura
- codigo-manutenibilidade
- seguranca
- apis-integracoes
- dados-persistencia
- performance-escalabilidade
- confiabilidade-resiliencia
- observabilidade-operacao
- testes-qualidade
- ui-ux-fluxos
- infraestrutura-deploy-config

---

# Atualização obrigatória do `checklist-global.md`

Após criar a estrutura do core, atualize `/Auditoria/_framework/checklist-global.md` marcando todos os itens realmente criados nesta etapa.

Regras:
- marque os itens do Seed de Playbooks apenas se eles já existirem e forem compatíveis
- se os playbooks ainda não existirem, deixe os itens do Seed desmarcados
- se algum item do core não puder ser criado por conflito estrutural ou limitação real, não marque o item e registre a razão em `/Auditoria/_framework/bootstrap-report.md`

---

# Atualização obrigatória do `status-geral.md`

Após o Bootstrap Core:
- preencher `ultima_atualizacao` com timestamp real
- manter `versao_framework: 2.0`
- atualizar `status_bootstrap_core` para `completed` se o core ficar pronto
- atualizar `status_bootstrap_core` para `partial` se houver conflito ou pendência relevante
- manter `status_playbooks_seed: pending`, salvo se a etapa de playbooks já existir e estiver compatível
- manter todos os domínios com:
  - `status_current: not_started`
  - `run_id_atual: none`
  - `ultima_run_finalizada: none`
  - `total_runs: 0`
- manter `playbook_status: pending` para domínios ainda sem playbook
- se playbooks já existirem e estiverem compatíveis, refletir esse estado sem apagá-los

---

# Atualização obrigatória do `bootstrap-report.md`

Ao final da execução, atualize o report com:
- `data_hora_execucao` real
- `status_resultado`: `completed` ou `partial`
- marcação do que foi criado
- marcação do que já existia
- conflitos encontrados
- resumo final objetivo

No resumo final, explique claramente:
- se o core do framework foi inicializado com sucesso
- se havia algo preexistente
- se houve normalização
- se existe pendência para revisão humana
- se o Seed de Playbooks ainda está pendente ou já existia

---

# Regras finais do Bootstrap Core

1. Não apagar conteúdo histórico existente em `runs/`.
2. Não sobrescrever runs históricas.
3. Não criar domínios duplicados.
4. Não renomear silenciosamente estruturas preexistentes sem registrar isso no report.
5. Não iniciar runs reais.
6. Não preencher achados técnicos do projeto.
7. Não executar auditoria de nenhum domínio nesta etapa.
8. Não criar `/Auditoria/_framework/playbooks/index.md` nesta etapa, salvo se ele já existir e for apenas preservado.
9. Não criar os arquivos `*.playbook.md` nesta etapa, salvo se eles já existirem e forem apenas preservados.
10. Não modificar playbooks já existentes de forma compatível.

---

# Critério de conclusão desta execução

Esta execução só pode ser encerrada quando:
1. a estrutura oficial do core estiver criada ou parcialmente criada com conflitos registrados
2. os arquivos centrais do core estiverem criados
3. os templates estiverem criados
4. os domínios oficiais estiverem inicializados
5. a pasta oficial de playbooks existir
6. `/Auditoria/_framework/checklist-global.md` estiver atualizado
7. `/Auditoria/_framework/status-geral.md` estiver atualizado
8. `/Auditoria/_framework/bootstrap-report.md` estiver atualizado
9. `/Auditoria/_framework/playbook-seed-report.md` estiver criado

---

# Saída esperada ao encerrar

Ao terminar:
1. não continue para o Seed de Playbooks
2. não inicie runs
3. apenas registre o Bootstrap Core concluído
4. encerre a execução
