# Acompanhamento da Auditoria

## Identificação
- dominio: seguranca
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
