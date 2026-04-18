---
kind: prompt
id: prompt-04
version: 2
name: finalizar-run
requires:
  - prompt-03-v4
---

# Prompt 04 — Finalizar Run do Framework de Auditoria

Você é um agente local operando diretamente no repositório.

Sua tarefa nesta execução é **somente** arquivar formalmente a run de auditoria que está em `ready_for_finalize`, movendo seu conteúdo final para o histórico, atualizando os índices e reinicializando o `current/` para uso futuro.

---

# Regra máxima desta execução

## O que você deve fazer
1. Identificar a run em `ready_for_finalize`
2. Validar que a run está realmente pronta para fechamento
3. Copiar os arquivos finais para o histórico em `runs/`
4. Atualizar `runs-index.md` do domínio
5. Atualizar `status-geral.md`
6. Reinicializar `current/` com templates limpos
7. Confirmar ao usuário

## O que você **nunca deve fazer**
- Modificar qualquer arquivo fora de `/Auditoria`
- Modificar código-fonte do projeto auditado
- Modificar testes ou infraestrutura do projeto
- Finalizar uma run que não esteja em `ready_for_finalize`
- Apagar arquivos históricos existentes em `runs/`
- Sobrescrever runs históricas anteriores
- Arquivar run com conteúdo incompleto sem registrar a situação
- Alterar o conteúdo dos arquivos ao copiá-los para o histórico

**Arquivos fora de `/Auditoria` são estritamente somente leitura.**

---

# Etapa 1 — Leitura obrigatória antes de qualquer ação

Leia os seguintes arquivos **nesta ordem** antes de qualquer outra ação:

1. `/Auditoria/_framework/framework.md`
2. `/Auditoria/_framework/execution-rules.md`
3. `/Auditoria/_framework/convencoes.md`
4. `/Auditoria/_framework/lifecycle.md`
5. `/Auditoria/_framework/state-machine.md`
6. `/Auditoria/_framework/status-geral.md`

Identifique qual domínio possui run em `ready_for_finalize` verificando o campo `status_current` em `status-geral.md`.

## Se não houver nenhum domínio em `ready_for_finalize`

Verifique se há domínio em `in_progress` ou `blocked`.

Se sim, informe:
```
Não há run pronta para finalização.

Status atual encontrado: {{STATUS}} no domínio {{DOMINIO}}

Para finalizar uma run, ela precisa estar em `ready_for_finalize`.
Execute o Prompt 03 — Executar Run para completar a auditoria antes de finalizar.
```

Se não houver nenhuma run ativa, informe:
```
Não há nenhuma run ativa no momento.
Execute o Prompt 02 — Iniciar Run para começar uma nova auditoria.
```

**Encerre sem alterar arquivos.**

---

# Etapa 2 — Leitura e validação da run

Leia os seguintes arquivos do domínio identificado:

1. `/Auditoria/{{DOMINIO}}/current/metadata.md`
2. `/Auditoria/{{DOMINIO}}/current/acompanhamento.md`
3. `/Auditoria/{{DOMINIO}}/current/achados.md`
4. `/Auditoria/{{DOMINIO}}/current/relatorio-final.md`

Extraia do `metadata.md`:
- `run_id`
- `status`
- `iniciado_em`

Extraia do `relatorio-final.md`:
- `avaliacao` (campo Avaliacao Geral do Dominio)
- `pronto_para_finalizar`
- distribuição por severidade

## Validação de prontidão

Verifique obrigatoriamente cada item abaixo:

| Item | Verificação |
|---|---|
| `metadata.md` | `status` é `ready_for_finalize` |
| `acompanhamento.md` | sem bloqueios abertos sem decisão |
| `achados.md` | consolidado (sem duplicidades óbvias) |
| `relatorio-final.md` | `pronto_para_finalizar: sim` |
| `relatorio-final.md` | `avaliacao` preenchida com valor válido |
| `relatorio-final.md` | `Resumo Executivo` preenchido |

Se algum item crítico não estiver atendido:

```
A run não está completamente pronta para finalização.

Problema identificado: {{DESCRICAO_DO_PROBLEMA}}

Retorne ao Prompt 03 — Executar Run para corrigir antes de finalizar.
```

**Encerre sem alterar arquivos.**

Se tudo estiver válido, prossiga para a Etapa 3.

---

# Etapa 3 — Confirmação com o usuário

Antes de arquivar, apresente o resumo e solicite confirmação:

```
Pronto para finalizar a seguinte run:

Domínio:    {{DOMINIO}}
Run ID:     {{RUN_ID}}
Iniciada:   {{INICIADO_EM}}
Status:     ready_for_finalize
Avaliação:  {{AVALIACAO}}

Achados:
  Críticos:     {{N}}
  Altos:        {{N}}
  Médios:       {{N}}
  Baixos:       {{N}}
  Informativos: {{N}}

Esta ação irá:
1. Copiar os arquivos finais para /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/
2. Atualizar runs-index.md do domínio
3. Atualizar status-geral.md
4. Reinicializar current/ com templates limpos

Confirma o encerramento desta run? (sim/não)
```

Aguarde a confirmação do usuário.

Se o usuário responder **não** ou qualquer variação negativa:
```
Finalização cancelada. Nenhum arquivo foi alterado.
```
**Encerre sem alterar arquivos.**

Se o usuário responder **sim** ou qualquer variação positiva, prossiga para a Etapa 4.

---

# Etapa 4 — Criação da pasta histórica da run

Crie a pasta:
`/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/`

Se essa pasta já existir por algum motivo:
- Não sobrescreva
- Registre o conflito
- Informe o usuário
- **Encerre sem alterar arquivos**

---

# Etapa 5 — Cópia dos arquivos finais para o histórico

Copie os seguintes arquivos de `current/` para `runs/{{RUN_ID}}/`, **sem modificar o conteúdo**:

1. `metadata.md` → `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/metadata.md`
2. `acompanhamento.md` → `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/acompanhamento.md`
3. `achados.md` → `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/achados.md`
4. `relatorio-final.md` → `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/relatorio-final.md`

Após copiar cada arquivo, confirme que o arquivo de destino existe e que o conteúdo foi preservado integralmente.

Se qualquer cópia falhar:
- Não continue
- Registre o erro
- Informe o usuário
- Não apague os arquivos de `current/`
- **Encerre preservando o estado atual**

---

# Etapa 6 — Atualização do metadata histórico

No arquivo copiado `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/metadata.md`, atualize apenas os seguintes campos:

```
- status: completed
- finalizado_em: {{TIMESTAMP_ATUAL}}
```

Não altere nenhum outro campo do metadata histórico.

---

# Etapa 7 — Atualização do runs-index.md

Atualize `/Auditoria/{{DOMINIO}}/runs-index.md` adicionando uma entrada no topo da lista (mais recente primeiro):

```markdown
### RUN {{RUN_ID}}
- status: completed
- iniciado_em: {{INICIADO_EM}}
- finalizado_em: {{TIMESTAMP_ATUAL}}
- escopo: auditoria completa do domínio {{DOMINIO}}
- avaliacao_final: {{AVALIACAO}}
- achados:
  - critico: {{N}}
  - alto: {{N}}
  - medio: {{N}}
  - baixo: {{N}}
  - informativo: {{N}}
- pasta_historica: /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/
```

Atualize também o cabeçalho do arquivo:
- `ultima_atualizacao`: timestamp atual
- `total_runs_registradas`: incrementar em 1

---

# Etapa 8 — Atualização do status-geral.md

Atualize `/Auditoria/_framework/status-geral.md`:

- `ultima_atualizacao`: timestamp atual
- Para o domínio finalizado:
  - `status_current`: `not_started`
  - `run_id_atual`: `none`
  - `ultima_run_finalizada`: `{{RUN_ID}}`
  - `total_runs`: incrementar em 1
- Recalcule `dominios_com_run_ativa` e `dominios_com_historico`
- Recalcule `total_runs_historicas` somando o total de todas as runs finalizadas
- **Não altere** o status de outros domínios

---

# Etapa 9 — Reinicialização do current/

Reinicialize os arquivos de `current/` do domínio com templates limpos, prontos para uma futura run.

## 9.1 — `/Auditoria/{{DOMINIO}}/current/metadata.md`

```markdown
# Metadata da Run Atual

- dominio: {{DOMINIO}}
- run_id: none
- status: not_started
- iniciado_em: none
- finalizado_em: none
- escopo: none
- origem: reinicializado pelo Prompt 04 apos finalizacao de {{RUN_ID}}
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: {{RUN_ID}}
- observacoes: current reinicializado em {{TIMESTAMP_ATUAL}} apos arquivamento da run {{RUN_ID}}

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
- Em `current`, os estados válidos são: not_started, in_progress, blocked, ready_for_finalize.

## Atualização Esperada
Atualize este arquivo apenas quando houver mudança real de estado da run.
```

## 9.2 — `/Auditoria/{{DOMINIO}}/current/acompanhamento.md`

```markdown
# Acompanhamento da Auditoria

## Identificação
- dominio: {{DOMINIO}}
- run_id: none
- status_atual: not_started
- ultima_atualizacao: {{TIMESTAMP_ATUAL}}

## Objetivo da Run
A definir no início da próxima run.

## Escopo Planejado
A definir no início da próxima run.

## Fases Planejadas
A definir no início da próxima run com base no playbook do domínio.

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
- Arquivos fora de /Auditoria são somente leitura durante toda a run.

## Histórico de Execuções

### Execução 000
- data_hora: {{TIMESTAMP_ATUAL}}
- objetivo: reinicializacao do current apos finalizacao da run {{RUN_ID}}
- status_resultado: completed
- arquivos_ou_areas_analisadas:
  - none
- acoes_realizadas:
  - current reinicializado pelo Prompt 04
  - run {{RUN_ID}} arquivada em /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/
- achados_resumidos:
  - none
- bloqueios:
  - none
- proximo_passo_obrigatorio:
  - executar Prompt 02 para iniciar nova run quando necessario

## Achados Relacionados Nesta Run
- nenhum ate o momento

## Bloqueios e Impedimentos
- nenhum ate o momento

## Proximo Passo Obrigatorio
Executar Prompt 02 — Iniciar Run para abrir uma nova auditoria deste domínio quando necessário.

## Critério para Marcar `ready_for_finalize`
A definir com base no playbook do domínio na próxima run.
```

## 9.3 — `/Auditoria/{{DOMINIO}}/current/achados.md`

```markdown
# Achados da Auditoria

## Identificação
- dominio: {{DOMINIO}}
- run_id: none
- ultima_atualizacao: {{TIMESTAMP_ATUAL}}

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese com justificativa.

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

## Achados Registrados
Nenhum achado registrado ate o momento.
```

## 9.4 — `/Auditoria/{{DOMINIO}}/current/relatorio-final.md`

```markdown
# Relatório Final da Auditoria

## Identificação
- dominio: {{DOMINIO}}
- run_id: none
- status_run: not_started
- iniciado_em: none
- finalizado_em: none
- ultima_atualizacao: {{TIMESTAMP_ATUAL}}

## Objetivo da Run
A definir no início da próxima run.

## Escopo Executado
- none

## Escopo Nao Coberto ou Parcial
- none

## Resumo Executivo
- none

## Principais Achados
- none

## Distribuicao por Severidade
- critico: 0
- alto: 0
- medio: 0
- baixo: 0
- informativo: 0

## Riscos Prioritarios
- none

## Recomendacoes Prioritarias
- none

## Avaliacao Geral do Dominio
- avaliacao: pendente

## Prontidao para Encerramento
- pronto_para_finalizar: nao
- justificativa: aguardando inicio de nova run

## Observacoes Finais
- none
```

---

# Etapa 10 — Confirmação final ao usuário

Após concluir todas as etapas, informe o usuário:

```
Run finalizada e arquivada com sucesso.

Domínio:    {{DOMINIO}}
Run ID:     {{RUN_ID}}
Arquivada:  /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/
Avaliação:  {{AVALIACAO}}

Achados arquivados:
  Críticos:     {{N}}
  Altos:        {{N}}
  Médios:       {{N}}
  Baixos:       {{N}}
  Informativos: {{N}}

O domínio {{DOMINIO}} está pronto para uma nova auditoria futura.

Próximos passos possíveis:
- Para auditar outro domínio: execute o Prompt 02 — Iniciar Run
- Para rever o histórico desta auditoria: consulte /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/relatorio-final.md
- Para ver o histórico completo do domínio: consulte /Auditoria/{{DOMINIO}}/runs-index.md
```

---

# Regras finais desta execução

1. Não alterar arquivos fora de `/Auditoria`.
2. Não modificar código-fonte, testes ou infraestrutura do projeto auditado.
3. Não finalizar run que não esteja em `ready_for_finalize`.
4. Não apagar histórico existente em `runs/`.
5. Não sobrescrever run histórica anterior.
6. Não alterar conteúdo dos arquivos ao copiá-los para o histórico.
7. Não prosseguir se a cópia para `runs/` falhar — preservar `current/` intacto.
8. Não finalizar mais de uma run por execução.
9. Não reinicializar `current/` antes de confirmar que a cópia histórica foi bem-sucedida.

---

# Critério de conclusão desta execução

Esta execução só pode ser encerrada com sucesso quando:

1. A run em `ready_for_finalize` foi identificada e validada
2. O usuário confirmou o encerramento
3. A pasta `runs/{{RUN_ID}}/` foi criada com os 4 arquivos copiados integralmente
4. O `metadata.md` histórico foi atualizado com `status: completed` e `finalizado_em`
5. O `runs-index.md` foi atualizado com a entrada da run finalizada
6. O `status-geral.md` foi atualizado com `status_current: not_started` e histórico incrementado
7. O `current/` foi reinicializado com templates limpos
8. O usuário recebeu a confirmação final com o resumo e os próximos passos possíveis
