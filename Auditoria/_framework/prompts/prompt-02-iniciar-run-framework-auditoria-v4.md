# Prompt 02 — Iniciar Run do Framework de Auditoria

Você é um agente local operando diretamente no repositório.

Sua tarefa nesta execução é **somente** abrir formalmente uma nova run de auditoria para um único domínio escolhido pelo usuário, com base no playbook oficial desse domínio.

---

# Objetivo

1. Apresentar os 11 domínios de auditoria disponíveis
2. Receber a escolha do usuário
3. Validar o domínio escolhido
4. Ler o playbook oficial desse domínio
5. Inicializar a run com base nesse playbook
6. Atualizar os arquivos de controle
7. Encerrar

Você **não deve** executar auditoria nesta etapa.
Você **não deve** finalizar run nesta etapa.
Você **não deve** alterar arquivos fora de `/Auditoria`.

---

# Etapa 0 — Leitura obrigatória antes de qualquer ação

Leia os seguintes arquivos **nesta ordem** antes de qualquer outra ação:

1. `/Auditoria/_framework/framework.md`
2. `/Auditoria/_framework/execution-rules.md`
3. `/Auditoria/_framework/convencoes.md`
4. `/Auditoria/_framework/lifecycle.md`
5. `/Auditoria/_framework/state-machine.md`
6. `/Auditoria/_framework/status-geral.md`

Se qualquer um desses arquivos não existir, **aborte imediatamente** e oriente o usuário a executar o Prompt 01A — Bootstrap Core antes de continuar.

---

# Etapa 1 — Apresentação dos domínios disponíveis

Apresente ao usuário os domínios oficiais disponíveis:

```
Domínios de auditoria disponíveis:

 1. arquitetura
 2. codigo-manutenibilidade
 3. seguranca
 4. apis-integracoes
 5. dados-persistencia
 6. performance-escalabilidade
 7. confiabilidade-resiliencia
 8. observabilidade-operacao
 9. testes-qualidade
10. ui-ux-fluxos
11. infraestrutura-deploy-config

Qual domínio você deseja auditar agora?
```

Aguarde a resposta do usuário antes de continuar.

---

# Etapa 2 — Validação do domínio escolhido

Após receber a resposta, valide:

1. O domínio informado é exatamente um dos 11 domínios oficiais listados acima.
2. Use o nome canônico exato na forma `nome-com-hifens` (exemplo: `seguranca`, `apis-integracoes`).
3. Se o usuário informar número, converta para o nome canônico correspondente.
4. Se o domínio informado for ambíguo, inválido ou não reconhecível, informe claramente e **não avance**.

---

# Etapa 3 — Validação da estrutura do framework

Antes de abrir a run, valide **obrigatoriamente** a existência destes caminhos:

- `/Auditoria/_framework/framework.md`
- `/Auditoria/_framework/convencoes.md`
- `/Auditoria/_framework/lifecycle.md`
- `/Auditoria/_framework/execution-rules.md`
- `/Auditoria/_framework/state-machine.md`
- `/Auditoria/_framework/status-geral.md`
- `/Auditoria/_framework/templates/metadata.template.md`
- `/Auditoria/_framework/templates/acompanhamento.template.md`
- `/Auditoria/_framework/templates/achados.template.md`
- `/Auditoria/_framework/templates/relatorio-final.template.md`
- `/Auditoria/_framework/playbooks/index.md`
- `/Auditoria/_framework/playbooks/{{DOMINIO_ESCOLHIDO}}.playbook.md`
- `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/`
- `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/metadata.md`
- `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/acompanhamento.md`
- `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/achados.md`
- `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/relatorio-final.md`
- `/Auditoria/{{DOMINIO_ESCOLHIDO}}/runs/`

Se qualquer um desses itens estiver ausente:
- **Aborte imediatamente**
- Informe qual item está faltando
- Oriente o usuário a executar o Prompt 01A e/ou 01B antes de continuar
- Não crie estrutura paralela
- Não improvise correção

---

# Etapa 4 — Verificação de run ativa

Leia `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/metadata.md` e verifique o campo `status`.

## Estado A — `not_started`
A run pode ser iniciada normalmente. Prossiga para a Etapa 5.

## Estado B — `in_progress`, `blocked` ou `ready_for_finalize`
Já existe uma run ativa neste domínio.

Informe o usuário:
```
Já existe uma run ativa no domínio {{DOMINIO_ESCOLHIDO}}.

Status atual: {{STATUS}}
Run ID: {{RUN_ID}}

Para iniciar uma nova run neste domínio, você deve primeiro finalizar a run atual usando o Prompt 04 — Finalizar Run.

Nenhuma alteração foi feita.
```

**Não altere nenhum arquivo. Encerre.**

## Estado C — qualquer outro valor inesperado ou ausente
Informe o conflito e **não avance**.

---

# Etapa 5 — Leitura do playbook

Leia o arquivo:
`/Auditoria/_framework/playbooks/{{DOMINIO_ESCOLHIDO}}.playbook.md`

Extraia obrigatoriamente:
- **Objetivo do Domínio** → usará em `acompanhamento.md`
- **Escopo Padrão da Run** → usará em `acompanhamento.md`
- **Ordem Oficial das Fases** → usará como fases planejadas em `acompanhamento.md`
- **Critérios para `ready_for_finalize`** → registrará em `acompanhamento.md`
- **Situações Típicas de Bloqueio** → registrará em `acompanhamento.md`

Não invente fases. Não reordene as fases. Use exatamente o que estiver no playbook.

---

# Etapa 6 — Geração do Run ID

Gere o Run ID com base no timestamp atual no formato:

```
YYYY-MM-DD_HH-mm-ss
```

Exemplo: `2026-03-22_14-30-00`

Use este mesmo Run ID em todos os arquivos atualizados nesta execução.

---

# Etapa 7 — Inicialização da run

Atualize os quatro arquivos de `current/` do domínio escolhido.

## 7.1 — `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/metadata.md`

Substitua o conteúdo pelo seguinte, preenchendo os valores reais:

```markdown
# Metadata da Run Atual

- dominio: {{DOMINIO_ESCOLHIDO}}
- run_id: {{RUN_ID}}
- status: in_progress
- iniciado_em: {{TIMESTAMP}}
- finalizado_em: none
- escopo: auditoria completa do domínio {{DOMINIO_ESCOLHIDO}} conforme playbook oficial
- origem: prompt-02-iniciar-run
- versao_framework: 2.0
- responsavel_execucao: agente-local
- modo_execucao: incremental-por-fase
- auditoria_anterior_relacionada: none
- observacoes: run iniciada via Prompt 02 com base no playbook oficial do domínio

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

## 7.2 — `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/acompanhamento.md`

Substitua o conteúdo pelo seguinte, preenchendo com os dados extraídos do playbook na Etapa 5:

```markdown
# Acompanhamento da Auditoria

## Identificação
- dominio: {{DOMINIO_ESCOLHIDO}}
- run_id: {{RUN_ID}}
- status_atual: in_progress
- ultima_atualizacao: {{TIMESTAMP}}

## Objetivo da Run
{{OBJETIVO_DO_DOMINIO_EXTRAIDO_DO_PLAYBOOK}}

## Escopo Planejado
{{ESCOPO_PADRAO_EXTRAIDO_DO_PLAYBOOK}}

## Fases Planejadas
{{ORDEM_OFICIAL_DAS_FASES_EXTRAIDA_DO_PLAYBOOK}}

## Fase Atual
- fase_atual: {{PRIMEIRA_FASE_DA_ORDEM_OFICIAL}}
- lote_atual: 1
- descricao_lote_atual: início da execução da primeira fase conforme playbook

## Progresso Geral
- [ ] Run iniciada
- [ ] Escopo definido
{{CHECKLIST_DE_FASES_GERADO_A_PARTIR_DA_ORDEM_OFICIAL}}
- [ ] Achados consolidados
- [ ] Run pronta para finalização

## Regras de Execução
- Executar apenas uma fase ou um lote pequeno por vez.
- Não pular fases pendentes sem registrar justificativa.
- Não marcar etapa como concluída sem evidência mínima no histórico.
- Sempre atualizar este arquivo ao final de cada execução.
- Se houver bloqueio, registrar em Bloqueios e Impedimentos.
- Ao concluir o lote atual, definir explicitamente o próximo passo.
- Arquivos fora de /Auditoria são somente leitura durante toda a run.

## Histórico de Execuções

### Execução 000
- data_hora: {{TIMESTAMP}}
- objetivo: abertura formal da run via Prompt 02
- status_resultado: completed
- arquivos_ou_areas_analisadas:
  - playbook do domínio {{DOMINIO_ESCOLHIDO}}
- acoes_realizadas:
  - run_id gerado: {{RUN_ID}}
  - metadata.md inicializado com status in_progress
  - acompanhamento.md populado com objetivo, escopo e fases do playbook
  - achados.md reinicializado
  - relatorio-final.md reinicializado
  - status-geral.md atualizado
- achados_resumidos:
  - nenhum ainda
- bloqueios:
  - nenhum
- proximo_passo_obrigatorio:
  - executar Prompt 03 — Executar Run para iniciar a primeira fase: {{PRIMEIRA_FASE_DA_ORDEM_OFICIAL}}

## Achados Relacionados Nesta Run
- nenhum ate o momento

## Bloqueios e Impedimentos
- nenhum ate o momento

## Proximo Passo Obrigatorio
Executar o Prompt 03 — Executar Run.
A primeira fase a executar é: {{PRIMEIRA_FASE_DA_ORDEM_OFICIAL}}

## Critério para Marcar `ready_for_finalize`
{{CRITERIOS_READY_FOR_FINALIZE_EXTRAIDOS_DO_PLAYBOOK}}

## Situações Típicas de Bloqueio
{{SITUACOES_DE_BLOQUEIO_EXTRAIDAS_DO_PLAYBOOK}}
```

## 7.3 — `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/achados.md`

Substitua o conteúdo pelo template inicial:

```markdown
# Achados da Auditoria

## Identificação
- dominio: {{DOMINIO_ESCOLHIDO}}
- run_id: {{RUN_ID}}
- ultima_atualizacao: {{TIMESTAMP}}

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

## 7.4 — `/Auditoria/{{DOMINIO_ESCOLHIDO}}/current/relatorio-final.md`

Substitua o conteúdo pelo template inicial:

```markdown
# Relatório Final da Auditoria

## Identificação
- dominio: {{DOMINIO_ESCOLHIDO}}
- run_id: {{RUN_ID}}
- status_run: in_progress
- iniciado_em: {{TIMESTAMP}}
- finalizado_em: none
- ultima_atualizacao: {{TIMESTAMP}}

## Objetivo da Run
{{OBJETIVO_DO_DOMINIO_EXTRAIDO_DO_PLAYBOOK}}

## Escopo Executado
- a preencher durante a execução

## Escopo Nao Coberto ou Parcial
- a preencher durante a execução

## Resumo Executivo
- a preencher ao consolidar a run

## Principais Achados
- a preencher ao consolidar a run

## Distribuicao por Severidade
- critico: 0
- alto: 0
- medio: 0
- baixo: 0
- informativo: 0

## Riscos Prioritarios
- a preencher ao consolidar a run

## Recomendacoes Prioritarias
- a preencher ao consolidar a run

## Avaliacao Geral do Dominio
- avaliacao: pendente

## Prontidao para Encerramento
- pronto_para_finalizar: nao
- justificativa: run em andamento

## Observacoes Finais
- a preencher ao consolidar a run
```

---

# Etapa 8 — Atualização do status-geral.md

Atualize `/Auditoria/_framework/status-geral.md`:

- `ultima_atualizacao`: timestamp atual
- Para o domínio iniciado:
  - `status_current`: `in_progress`
  - `run_id_atual`: `{{RUN_ID}}`
- Recalcule `dominios_com_run_ativa` contando todos os domínios com status `in_progress`, `blocked` ou `ready_for_finalize`
- **Não altere** o status de outros domínios
- **Não zere** `total_runs`, `ultima_run_finalizada` ou qualquer histórico existente

---

# Etapa 9 — Confirmação ao usuário

Ao concluir, informe o usuário:

```
Run iniciada com sucesso.

Domínio: {{DOMINIO_ESCOLHIDO}}
Run ID:  {{RUN_ID}}
Status:  in_progress

Fases planejadas conforme playbook:
{{LISTA_NUMERADA_DAS_FASES}}

Próximo passo:
Execute o Prompt 03 — Executar Run para iniciar a auditoria.
A primeira fase a executar é: {{PRIMEIRA_FASE_DA_ORDEM_OFICIAL}}
```

---

# Regras finais desta execução

1. Não executar auditoria técnica do projeto.
2. Não analisar código, arquitetura, segurança ou qualquer domínio.
3. Não alterar arquivos fora de `/Auditoria`.
4. Não modificar código-fonte do projeto auditado.
5. Não modificar testes ou infraestrutura do projeto.
6. Não abrir mais de uma run por execução.
7. Não sobrescrever run ativa existente.
8. Não inventar fases — usar apenas as do playbook.
9. Não modificar outros domínios além do escolhido.
10. Não alterar `runs/` nem `runs-index.md` nesta etapa.

---

# Critério de conclusão desta execução

Esta execução só pode ser encerrada quando:
1. o domínio escolhido for válido e confirmado
2. a estrutura do framework estiver validada
3. não houver run ativa em conflito
4. os quatro arquivos de `current/` estiverem inicializados com os dados do playbook
5. `/Auditoria/_framework/status-geral.md` estiver atualizado
6. o usuário tiver recebido a confirmação com as fases planejadas e o próximo passo

---

# Saída esperada ao encerrar

Ao terminar:
1. não executar fases de auditoria
2. não finalizar run
3. apenas confirmar a run aberta
4. encerrar
