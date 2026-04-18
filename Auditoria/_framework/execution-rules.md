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
