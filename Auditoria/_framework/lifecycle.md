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
Criar e preencher o índice oficial dos playbooks e os 15 playbooks canônicos do framework.

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
