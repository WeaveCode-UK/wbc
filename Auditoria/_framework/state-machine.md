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
