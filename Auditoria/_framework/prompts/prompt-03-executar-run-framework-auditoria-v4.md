---
kind: prompt
id: prompt-03
version: 4
name: executar-run
requires:
  - prompt-02-v4
---

# Prompt 03 — Executar Run do Framework de Auditoria

Você é um agente local operando diretamente no repositório.

Sua tarefa nesta execução é **somente** executar a run de auditoria atualmente aberta, fase por fase, com base no playbook oficial do domínio, registrando achados, histórico e progresso em cada etapa, até que a run atinja `ready_for_finalize` ou `blocked`.

---

# Regra máxima desta execução

## O que você deve fazer
1. Ler o estado atual da run aberta
2. Ler o playbook do domínio correspondente
3. Executar cada fase do playbook na ordem oficial
4. Registrar achados com evidência real do repositório
5. Persistir o progresso após cada fase
6. Parar quando a run atingir `ready_for_finalize` ou `blocked`

## O que você **nunca deve fazer**
- Modificar qualquer arquivo fora de `/Auditoria`
- Modificar código-fonte do projeto auditado
- Modificar testes do projeto auditado
- Modificar configurações ou infraestrutura do projeto auditado
- Iniciar nova run
- Finalizar ou arquivar a run atual
- Criar domínios novos
- Pular fase sem justificativa explícita
- Registrar achado sem evidência observável no repositório
- Inventar contexto que não esteja presente nos arquivos do projeto

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

Em seguida, identifique qual domínio possui run ativa verificando qual domínio está com `status_current: in_progress` ou `status_current: blocked` em `status-geral.md`.

Se não houver nenhum domínio com run ativa:
- Informe o usuário que não há run ativa
- Oriente a executar o Prompt 02 — Iniciar Run primeiro
- **Encerre sem alterar arquivos**

Se houver mais de um domínio com run ativa, use o que tiver `status_current: in_progress` mais recente, ou informe o conflito e peça confirmação ao usuário antes de continuar.

---

# Etapa 2 — Leitura do estado da run

Leia os seguintes arquivos do domínio identificado:

1. `/Auditoria/{{DOMINIO}}/current/metadata.md`
2. `/Auditoria/{{DOMINIO}}/current/acompanhamento.md`
3. `/Auditoria/{{DOMINIO}}/current/achados.md`
4. `/Auditoria/{{DOMINIO}}/current/relatorio-final.md`
5. `/Auditoria/{{DOMINIO}}/runs-index.md`

Extraia do `metadata.md`:
- `run_id`
- `status`

Extraia do `acompanhamento.md`:
- fases planejadas
- fase atual
- progresso geral
- próximo passo obrigatório
- bloqueios existentes

## Validação de estado

### Se `status` for `not_started`
A run não foi iniciada formalmente. Informe o usuário e oriente a executar o Prompt 02 primeiro. **Encerre sem alterar arquivos.**

### Se `status` for `ready_for_finalize`
A run já está pronta para finalização. Informe o usuário e oriente a executar o Prompt 04 — Finalizar Run. **Encerre sem alterar arquivos.**

### Se `status` for `completed` ou `archived`
Esta run já foi encerrada. Informe o usuário. **Encerre sem alterar arquivos.**

### Se `status` for `blocked`
Leia o bloqueio registrado. Informe o usuário sobre o impedimento existente e pergunte se ele foi resolvido antes de continuar. Só prossiga se o usuário confirmar que o bloqueio foi resolvido.

### Se `status` for `in_progress`
Prossiga para a Etapa 3.

---

# Etapa 3 — Leitura do playbook

Leia o arquivo:
`/Auditoria/_framework/playbooks/{{DOMINIO}}.playbook.md`

Se o arquivo não existir:
- Registre bloqueio em `acompanhamento.md` e `metadata.md`
- Marque status como `blocked`
- Informe o usuário que o playbook está ausente e que o Prompt 01B deve ser executado
- **Encerre**

Do playbook, extraia obrigatoriamente:
- Ordem Oficial das Fases
- Para cada fase: objetivo, checks obrigatórios, evidências esperadas, possíveis achados, critério de conclusão, condições de bloqueio
- Critérios para `ready_for_finalize`
- Situações Típicas de Bloqueio
- Regras Gerais do Domínio

---

# Etapa 4 — Execução das fases

Execute as fases na **Ordem Oficial** definida no playbook.

Comece pela fase indicada em `fase_atual` no `acompanhamento.md`. Se uma fase já estiver marcada como concluída ou `nao_aplicavel` no progresso, avance para a próxima.

## Para cada fase, siga este protocolo:

### 4.1 — Anunciar a fase

Informe claramente ao usuário qual fase está sendo executada:
```
Executando: {{NOME_DA_FASE}}
Domínio: {{DOMINIO}}
Run ID: {{RUN_ID}}
```

### 4.2 — Executar os checks obrigatórios da fase

Para cada check obrigatório listado no playbook para esta fase:

1. Leia os arquivos e áreas relevantes do repositório (somente leitura)
2. Analise com base no que está presente — nunca suponha
3. Se não houver evidência suficiente para um check, registre como limitação, não como achado confirmado
4. Se um check não se aplicar ao projeto, registre `nao_aplicavel` com justificativa objetiva

### 4.3 — Registrar achados

Para cada problema identificado com evidência real:

Adicione um bloco em `/Auditoria/{{DOMINIO}}/current/achados.md` com este formato:

```markdown
### ACH-{{NUMERO_SEQUENCIAL}}
- titulo: {{TITULO_CURTO}}
- severidade: {{critico|alto|medio|baixo|informativo}}
- categoria: {{CATEGORIA_COMPATIVEL_COM_O_DOMINIO}}
- status: aberto
- resumo: {{DESCRICAO_OBJETIVA}}

#### Evidencia
- arquivo_ou_area: {{CAMINHO_OU_AREA_REAL}}
- detalhe: {{DESCRICAO_DA_EVIDENCIA_NO_CODIGO_OU_ESTRUTURA}}

#### Impacto
- tecnico: {{IMPACTO_TECNICO}}
- negocio: {{IMPACTO_NO_NEGOCIO_OU_OPERACAO}}

#### Recomendacao
- acao_sugerida: {{ACAO_CONCRETA}}
- prioridade: {{alta|media|baixa}}

#### Observacoes
- {{OBSERVACAO_ADICIONAL_SE_HOUVER}}
```

**Regras de registro de achados:**
- Só registre achado com evidência real e observável no repositório
- Se o problema não puder ser confirmado, registre como hipótese com justificativa
- Nunca duplique um achado já registrado
- O número sequencial deve ser único dentro da run (ACH-001, ACH-002, etc.)
- Atualize `ultima_atualizacao` no cabeçalho de `achados.md` após cada novo achado

### 4.4 — Avaliar critério de conclusão da fase

Após executar todos os checks, avalie o critério de conclusão definido no playbook para esta fase.

**Se o critério de conclusão estiver atendido:**
- Marque a fase como concluída no `acompanhamento.md`
- Registre o bloco de execução (ver formato na Etapa 5)
- Avance para a próxima fase

**Se houver condição de bloqueio:**
- Registre o bloqueio com descrição clara
- Marque a fase como `blocked` no `acompanhamento.md`
- Atualize `metadata.md` com `status: blocked`
- Registre o bloco de execução com `status_resultado: blocked`
- Informe o usuário e **encerre**

**Se a fase não se aplicar ao projeto:**
- Registre `nao_aplicavel` com justificativa objetiva
- Avance para a próxima fase

### 4.5 — Persistir progresso após cada fase

Após concluir, bloquear ou marcar como não aplicável cada fase, **persista imediatamente** antes de avançar:

- Atualize `achados.md` se houver novos achados
- Atualize `acompanhamento.md` com o bloco da execução e o progresso
- Atualize `metadata.md` se houver mudança de estado
- Atualize `relatorio-final.md` se a fase trouxer informação relevante para o relatório

**Não avance para a próxima fase sem persistir.**

---

# Etapa 5 — Formato obrigatório do bloco de execução

Ao final de cada fase, adicione um bloco no histórico de `acompanhamento.md` com este formato:

```markdown
### Execução {{NUMERO}}
- data_hora: {{TIMESTAMP}}
- fase: {{NOME_DA_FASE}}
- objetivo: {{OBJETIVO_DA_FASE_CONFORME_PLAYBOOK}}
- status_resultado: {{completed|blocked|nao_aplicavel}}
- arquivos_ou_areas_analisadas:
  - {{LISTA_DOS_ARQUIVOS_E_AREAS_REALMENTE_INSPECIONADOS}}
- acoes_realizadas:
  - {{DESCRICAO_DAS_ACOES_EXECUTADAS}}
- achados_resumidos:
  - {{LISTA_DOS_ACHADOS_DESTA_FASE_COM_ID_E_SEVERIDADE}}
  - (ou: nenhum achado nesta fase)
- bloqueios:
  - {{DESCRICAO_DO_BLOQUEIO_SE_HOUVER}}
  - (ou: nenhum)
- proximo_passo_obrigatorio:
  - {{PROXIMA_FASE_A_EXECUTAR}}
  - (ou: run pronta para finalização)
  - (ou: run bloqueada — aguardando resolução)
```

Use o mesmo formato para fases concluídas, bloqueadas e não aplicáveis. Não use formatos alternativos.

---

# Etapa 6 — Atualização do relatorio-final.md durante a execução

Atualize `/Auditoria/{{DOMINIO}}/current/relatorio-final.md` progressivamente conforme as fases avançam:

- Após cada fase técnica: adicione ao campo `Escopo Executado` o que foi coberto
- Quando houver achados críticos ou altos: registre nos `Principais Achados` e `Riscos Prioritarios`
- Atualize `Distribuicao por Severidade` conforme novos achados forem registrados
- Atualize `ultima_atualizacao` a cada modificação

Não preencha `Resumo Executivo`, `Recomendacoes Prioritarias` e `Avaliacao Geral do Dominio` durante a execução — esses campos são para a fase de consolidação.

---

# Etapa 7 — Fase de Consolidação de Achados

Quando todas as fases técnicas do playbook estiverem concluídas (ou marcadas como `nao_aplicavel`), execute a fase de consolidação conforme definida no playbook.

Na consolidação:

1. Revise todos os achados em `achados.md`
2. Remova duplicidades
3. Confirme severidades
4. Separe achados do domínio de achados que pertencem a outros domínios
5. Atualize o status de cada achado conforme o resultado da revisão
6. Atualize `ultima_atualizacao` em `achados.md`

---

# Etapa 8 — Fase de Preparação para Finalização

Quando a consolidação estiver concluída, execute a fase de preparação conforme definida no playbook.

Na preparação:

1. Preencha o `relatorio-final.md` com:
   - Resumo Executivo completo
   - Principais Achados revisados
   - Distribuição por Severidade final
   - Riscos Prioritários
   - Recomendações Prioritárias em ordem objetiva
   - Avaliação Geral do Domínio (`adequado`, `aceitavel_com_ressalvas`, `preocupante` ou `critico`)
   - Prontidão para Encerramento: `sim`

2. Verifique os critérios de `ready_for_finalize` conforme o playbook:
   - todas as fases aplicáveis concluídas ou marcadas como `nao_aplicavel`
   - `achados.md` consolidado
   - `relatorio-final.md` preenchido
   - `acompanhamento.md` atualizado
   - sem bloqueios abertos sem decisão registrada

3. Se todos os critérios estiverem atendidos:
   - Atualize `metadata.md` com `status: ready_for_finalize`
   - Atualize `status-geral.md` com `status_current: ready_for_finalize` para o domínio
   - Atualize `acompanhamento.md` com o bloco final e `proximo_passo_obrigatorio: executar Prompt 04 — Finalizar Run`

---

# Etapa 9 — Atualização do status-geral.md

Atualize `/Auditoria/_framework/status-geral.md` sempre que houver mudança de estado relevante:

- `ultima_atualizacao`: timestamp atual
- Para o domínio em execução: `status_current` refletindo o estado real
- Recalcule `dominios_com_run_ativa` contando todos os domínios com `status_current` igual a `in_progress`, `blocked` ou `ready_for_finalize`
- **Não altere** o status de outros domínios
- **Não zere** histórico, `total_runs` ou `ultima_run_finalizada` de nenhum domínio

---

# Etapa 10 — Confirmação ao usuário ao encerrar

Ao atingir `ready_for_finalize`, informe o usuário:

```
Auditoria concluída.

Domínio: {{DOMINIO}}
Run ID:  {{RUN_ID}}
Status:  ready_for_finalize

Resumo:
- Fases executadas: {{NUMERO}}
- Achados registrados: {{TOTAL}}
  - Críticos: {{N}}
  - Altos: {{N}}
  - Médios: {{N}}
  - Baixos: {{N}}
  - Informativos: {{N}}

Avaliação geral: {{AVALIACAO}}

Próximo passo:
Execute o Prompt 04 — Finalizar Run para arquivar esta auditoria.
```

Se a run for bloqueada, informe:

```
Execução interrompida.

Domínio: {{DOMINIO}}
Run ID:  {{RUN_ID}}
Status:  blocked

Fase bloqueada: {{NOME_DA_FASE}}
Motivo: {{DESCRICAO_DO_BLOQUEIO}}
Condição para retomar: {{CONDICAO_DE_DESBLOQUEIO}}

Próximo passo:
Resolva o impedimento e execute o Prompt 03 novamente para retomar.
```

---

# Regras gerais de execução

1. Não inventar contexto. Trabalhar apenas com evidência real presente no repositório.
2. Não modificar nenhum arquivo fora de `/Auditoria`.
3. Não executar mais de uma run por execução.
4. Não pular fase sem justificativa registrada.
5. Não registrar achado sem evidência observável.
6. Não avançar de fase sem persistir o progresso.
7. Não finalizar a run — isso é responsabilidade do Prompt 04.
8. Se encontrar risco crítico, registrar imediatamente e continuar.
9. Se a fase não for aplicável ao projeto, registrar `nao_aplicavel` com justificativa objetiva e avançar.
10. Se houver conflito entre evidência e documentação do projeto, registrar o conflito como achado e documentar a limitação.
11. Sempre definir `proximo_passo_obrigatorio` antes de encerrar.
12. O estado oficial da run está nos arquivos — nunca na memória da conversa.

---

# Critério de conclusão desta execução

Esta execução só pode ser encerrada quando uma destas condições ocorrer:

1. **Run em `ready_for_finalize`**: todas as fases foram executadas, consolidação concluída, relatório final preenchido, usuário informado, Prompt 04 recomendado.

2. **Run em `blocked`**: impedimento real encontrado, bloqueio registrado com condição de desbloqueio, usuário informado sobre como retomar.

3. **Nenhuma run ativa encontrada**: usuário informado, nenhum arquivo alterado.

4. **Run em estado incompatível**: usuário informado, nenhum arquivo alterado.

Em nenhuma hipótese a execução deve encerrar com:
- progresso não persistido
- `proximo_passo_obrigatorio` indefinido
- achado sem ID sequencial
- fase concluída sem bloco de execução registrado
