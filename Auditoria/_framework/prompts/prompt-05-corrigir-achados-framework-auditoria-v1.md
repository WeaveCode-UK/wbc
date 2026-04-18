---
kind: prompt
id: prompt-05
version: 1
name: corrigir-achados
requires:
  - prompt-04-v2
---

# Prompt 05 — Corrigir Achados do Framework de Auditoria

Você é um agente local operando diretamente no repositório.

Sua tarefa nesta execução é **corrigir todos os achados** de uma run de auditoria finalizada, seguindo um pipeline de duas fases internas obrigatórias: **Fase Executor** e **Fase Revisor**.

Este prompt é o único do framework que **modifica código-fonte do projeto**. Todos os outros prompts operam em modo somente leitura fora de `/Auditoria`. Este prompt escreve no código, faz commits e pode solicitar merge.

---

# Regra máxima desta execução

## O que você deve fazer
1. Identificar a run de auditoria finalizada a ser corrigida
2. Ler os achados arquivados dessa run
3. Criar a branch de correção
4. Gerar o plano de correção completo
5. Apresentar o plano ao usuário e aguardar aprovação
6. Executar as correções aprovadas no código-fonte do projeto (Fase Executor)
7. Após a Fase Executor concluir, transicionar automaticamente para a Fase Revisor
8. Revisar cada correção individualmente cruzando achado × ação × código (Fase Revisor)
9. Validar o resultado técnico com type check e build
10. Gerar o relatório final de correção
11. Solicitar aprovação para merge na branch principal

## O que você **nunca deve fazer**
- Corrigir achados sem aprovação explícita do plano pelo usuário
- Pular achados sem justificativa técnica objetiva e registrada
- Marcar achado como corrigido sem que a correção esteja efetivamente no código
- Modificar os arquivos originais da run arquivada (`metadata.md`, `acompanhamento.md`, `relatorio-final.md` e `achados.md` dentro de `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/`)
- Criar runs de auditoria novas
- Iniciar ou finalizar runs de auditoria
- Fazer merge sem autorização explícita do usuário
- Rodar lint, testes E2E ou testes unitários automaticamente
- Alterar a estrutura do framework de auditoria fora da pasta de correção

---

# Restrições da Fase Executor

- Paralelização de tarefas de correção: **permitida**
- O executor pode corrigir múltiplos achados simultaneamente quando não houver dependência entre eles
- Cada achado corrigido deve gerar um commit individual na branch de correção
- O executor não faz revisão de qualidade — ele corrige e commita

---

# Restrições da Fase Revisor — GUARDRAILS CRÍTICOS

Estas regras são **invioláveis** e se sobrepõem a qualquer outra instrução:

1. **Paralelização: PROIBIDA.** A revisão é sequencial, achado por achado, um de cada vez. Nunca revisar dois achados simultaneamente. Nunca delegar revisão a subagentes paralelos. Nunca agrupar achados para revisar em lote.

2. **Modelo: somente o modelo de maior capacidade disponível.** A revisão exige o Opus ou equivalente de maior capacidade na configuração atual. Nunca delegar revisão a modelos inferiores (Sonnet, Haiku ou qualquer modelo menor). Se o ambiente forçar um modelo inferior, registrar bloqueio e interromper a revisão.

3. **Completude: 100% obrigatória.** Todos os achados aprovados devem ser revisados. Não é permitido pular achados, marcar como "parcialmente revisado", aceitar correção incompleta ou encerrar a revisão com achados pendentes.

4. **Autonomia corretiva: o Revisor corrige.** Se o Revisor encontrar discrepância entre o que o achado pedia e o que o Executor fez, o Revisor corrige diretamente no código. Não devolve ao Executor. Não registra como pendência. Corrige, commita e segue.

5. **Método de revisão: diff obrigatório.** O Revisor deve usar `git diff` do commit específico de cada achado para comparar o estado antes e depois da correção. Não basta olhar o arquivo atual — é necessário verificar exatamente o que mudou. O Revisor cruza três fontes: (a) o que o achado original descreve como problema e recomendação, (b) o diff do commit do Executor, (c) o estado atual do código no trecho afetado.

---

# Etapa 1 — Leitura obrigatória antes de qualquer ação

Leia os seguintes arquivos **nesta ordem** antes de qualquer outra ação:

1. `/Auditoria/_framework/framework.md`
2. `/Auditoria/_framework/execution-rules.md`
3. `/Auditoria/_framework/convencoes.md`
4. `/Auditoria/_framework/status-geral.md`

Em seguida, identifique qual domínio possui run finalizada disponível para correção.

---

# Etapa 2 — Identificação da run a corrigir

## Se o usuário especificou domínio e/ou run

Valide que a run indicada existe em:
`/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/`

Confirme que contém os 4 arquivos obrigatórios:
- `metadata.md`
- `acompanhamento.md`
- `achados.md`
- `relatorio-final.md`

Verifique em `metadata.md` que `status` é `completed`.

## Se o usuário não especificou

Consulte `/Auditoria/_framework/status-geral.md` e liste os domínios com `ultima_run_finalizada` diferente de `none`.

Apresente a lista ao usuário:

```
Runs finalizadas disponíveis para correção:

1. {{DOMINIO}} — Run: {{RUN_ID}}
2. {{DOMINIO}} — Run: {{RUN_ID}}
...

Qual run você deseja corrigir?
```

Aguarde a resposta antes de continuar.

## Se não houver nenhuma run finalizada

```
Não há runs finalizadas disponíveis para correção.

Para corrigir achados, é necessário primeiro:
1. Executar uma auditoria (Prompt 02 + Prompt 03)
2. Finalizar a run (Prompt 04)

Nenhum arquivo foi alterado.
```

**Encerre sem alterar arquivos.**

---

# Etapa 3 — Verificação de correção anterior e retomada

Verifique se já existe a pasta:
`/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/`

### Se a pasta não existe
Prossiga para a Etapa 4 (primeira execução).

### Se a pasta existe com `progresso.md`
Esta é uma **retomada de correção interrompida**.

Leia `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/progresso.md`.

Identifique:
- quais achados já foram corrigidos e commitados pelo Executor
- quais achados já foram revisados pelo Revisor
- em qual fase a interrupção ocorreu (Executor ou Revisor)
- qual é o próximo achado a tratar

Verifique que a branch `fix/{{DOMINIO}}/{{RUN_ID}}` existe:
- Se sim: mude para essa branch e retome de onde parou
- Se não: registre bloqueio — a branch foi apagada e a retomada precisa de intervenção manual

Informe o usuário:

```
Retomando correção interrompida.

Domínio: {{DOMINIO}}
Run:     {{RUN_ID}}
Branch:  fix/{{DOMINIO}}/{{RUN_ID}}

Progresso anterior:
- Achados corrigidos (Executor): {{N}} de {{TOTAL}}
- Achados revisados (Revisor):   {{N}} de {{TOTAL}}
- Fase atual: {{EXECUTOR|REVISOR}}
- Próximo achado: {{ACH-ID}}

Retomando a partir de {{ACH-ID}}.
```

Prossiga diretamente para a fase correspondente (Etapa 8 ou Etapa 10), respeitando o ponto de retomada.

---

# Etapa 4 — Leitura dos achados

Leia o arquivo:
`/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/achados.md`

Extraia **todos** os achados registrados, incluindo:
- ID (ACH-001, ACH-002, etc.)
- título
- severidade
- categoria
- status
- resumo
- evidência (arquivo ou área, detalhe)
- impacto (técnico e de negócio)
- recomendação (ação sugerida, prioridade)
- observações

## Classificação de corrigibilidade

Para cada achado, classifique como:

### `corrigivel`
O achado tem correção via código clara e viável. O agente pode implementar a correção diretamente no repositório.

Exemplos: validação de entrada ausente, rota sem autenticação, query sem índice, erro de tipagem, middleware faltante, configuração insegura em código.

### `corrigivel_parcial`
O código pode ser melhorado, mas a correção completa depende de validação humana, decisão de negócio ou informação que o agente não possui.

Exemplos: documentação arquitetural ausente (agente cria estrutura, humano valida conteúdo), schema de banco que precisa de migração em produção (agente cria migration, humano valida e executa), configuração que depende de credencial externa.

### `nao_corrigivel`
O achado não é resolvível via código no repositório. Depende de ação humana externa, infraestrutura, decisão de negócio ou acesso que o agente não possui.

Exemplos: credencial compartilhada entre ambientes no provedor, decisão de adotar MFA (decisão de produto), contrato com serviço externo, recurso de infraestrutura que precisa ser provisionado manualmente.

**Regra: na dúvida entre `corrigivel` e `corrigivel_parcial`, use `corrigivel_parcial`.
Na dúvida entre `corrigivel_parcial` e `nao_corrigivel`, use `corrigivel_parcial` e registre a limitação.**

---

# Etapa 5 — Geração do plano de correção

## Regra de ordenação

O plano **não deve** ser ordenado apenas por severidade. A ordem de execução deve respeitar **dependências entre achados**.

### Critérios de ordenação (em ordem de prioridade):

1. **Dependência técnica**: se corrigir ACH-003 antes de ACH-007 causaria conflito ou retrabalho, ACH-007 vem primeiro, independente da severidade.

2. **Proximidade de arquivo**: achados que tocam o mesmo arquivo ou a mesma área devem ser agrupados em sequência para evitar conflitos de merge e reduzir context switching.

3. **Severidade como desempate**: entre achados sem dependência e sem proximidade, ordenar por severidade (critico → alto → medio → baixo → informativo).

4. **Prioridade da recomendação como desempate secundário**: entre achados da mesma severidade, respeitar a prioridade definida na recomendação (alta → media → baixa).

## Formato do plano

Gere o plano em formato estruturado:

```markdown
# Plano de Correção

## Identificação
- dominio: {{DOMINIO}}
- run_id: {{RUN_ID}}
- data_geracao: {{TIMESTAMP}}
- total_achados: {{N}}
- corrigiveis: {{N}}
- corrigiveis_parciais: {{N}}
- nao_corrigiveis: {{N}}

## Ordem de Execução

### 1. ACH-{{ID}} — {{TITULO}}
- severidade: {{SEVERIDADE}}
- classificacao: {{corrigivel|corrigivel_parcial|nao_corrigivel}}
- arquivo_ou_area_afetada: {{CAMINHO}}
- acao_planejada: {{DESCRICAO_CONCRETA_DO_QUE_SERA_FEITO}}
- dependencias: {{LISTA_DE_ACH_IDS_QUE_DEVEM_SER_CORRIGIDOS_ANTES, ou: nenhuma}}
- justificativa_ordem: {{POR_QUE_ESTE_ACHADO_ESTA_NESTA_POSICAO}}
- risco_da_correcao: {{RISCO_DE_EFEITO_COLATERAL_DA_CORRECAO}}

### 2. ACH-{{ID}} — {{TITULO}}
...

## Achados Não Corrigíveis
Lista dos achados classificados como `nao_corrigivel` com justificativa para cada um.

### ACH-{{ID}} — {{TITULO}}
- motivo: {{JUSTIFICATIVA_TECNICA}}
- acao_recomendada_ao_usuario: {{O_QUE_O_USUARIO_DEVE_FAZER_MANUALMENTE}}

## Resumo do Plano
- Total a corrigir: {{N}}
- Total parcial (requer validação humana após correção): {{N}}
- Total não corrigível (ação humana necessária): {{N}}
- Estimativa de commits: {{N}}
```

---

# Etapa 6 — Aprovação do plano pelo usuário

Apresente o plano completo ao usuário e solicite aprovação:

```
Plano de correção gerado.

Domínio: {{DOMINIO}}
Run:     {{RUN_ID}}

Total de achados: {{N}}
  Corrigíveis:          {{N}}
  Corrigíveis parciais: {{N}}
  Não corrigíveis:      {{N}}

Ordem de execução:
1. ACH-{{ID}} ({{SEVERIDADE}}) — {{TITULO}} [{{CLASSIFICACAO}}]
2. ACH-{{ID}} ({{SEVERIDADE}}) — {{TITULO}} [{{CLASSIFICACAO}}]
...

Deseja aprovar o plano?
Opções:
- "sim" ou "aprovar" → executa todos os achados corrigíveis e parciais
- "aprovar exceto ACH-XXX, ACH-YYY" → executa todos menos os indicados
- "aprovar apenas ACH-XXX, ACH-YYY" → executa apenas os indicados
- "não" ou "cancelar" → encerra sem alterar nada
```

Aguarde a resposta do usuário.

### Se o usuário cancelar
```
Correção cancelada. Nenhum arquivo foi alterado.
```
**Encerre sem alterar arquivos.**

### Se o usuário aprovar parcialmente
Registre os achados não aprovados com status `nao_aprovado` no progresso. Prossiga apenas com os aprovados.

### Se o usuário aprovar
Prossiga para a Etapa 7.

---

# Etapa 7 — Criação da branch e estrutura de correção

## 7.1 — Criação da branch

Crie a branch de correção a partir da branch principal atual:

```bash
git checkout -b fix/{{DOMINIO}}/{{RUN_ID}}
```

Se a branch já existir (retomada), faça checkout nela:

```bash
git checkout fix/{{DOMINIO}}/{{RUN_ID}}
```

## 7.2 — Criação da pasta de correção

Crie a pasta:
`/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/`

Crie os seguintes arquivos iniciais:

### `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/plano-correcao.md`
Conteúdo: o plano gerado na Etapa 5, exatamente como aprovado, incluindo marcação dos achados não aprovados se houver.

### `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/progresso.md`

```markdown
# Progresso da Correção

## Identificação
- dominio: {{DOMINIO}}
- run_id: {{RUN_ID}}
- branch: fix/{{DOMINIO}}/{{RUN_ID}}
- data_inicio: {{TIMESTAMP}}
- ultima_atualizacao: {{TIMESTAMP}}
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: {{N}}
- corrigidos_executor: 0
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: {{N}}
- nao_aprovados: {{N}}
- pendentes: {{N}}

## Achados

### ACH-{{ID}}
- titulo: {{TITULO}}
- severidade: {{SEVERIDADE}}
- classificacao: {{corrigivel|corrigivel_parcial|nao_corrigivel}}
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

(repetir para cada achado)
```

### `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/relatorio-correcao.md`

```markdown
# Relatório de Correção

## Identificação
- dominio: {{DOMINIO}}
- run_id: {{RUN_ID}}
- branch: fix/{{DOMINIO}}/{{RUN_ID}}
- data_inicio: {{TIMESTAMP}}
- data_conclusao: none
- ultima_atualizacao: {{TIMESTAMP}}
- status: em_andamento

## Resumo Executivo
A preencher ao final da correção.

## Achados Corrigidos
A preencher ao final da correção.

## Achados Corrigidos com Intervenção do Revisor
A preencher ao final da correção.

## Achados Parciais (requerem validação humana)
A preencher ao final da correção.

## Achados Não Corrigíveis
A preencher ao final da correção.

## Achados Não Aprovados
A preencher ao final da correção.

## Validação Técnica
- type_check: pendente
- build: pendente
- tentativas_de_correcao_build: 0

## Merge
- status_merge: pendente
- branch_origem: fix/{{DOMINIO}}/{{RUN_ID}}
- branch_destino: main
- aprovado_por_usuario: nao
```

Commite a estrutura inicial:

```bash
git add /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/
git commit -m "chore(auditoria): inicializar correção da run {{RUN_ID}} do domínio {{DOMINIO}}"
```

---

# Etapa 8 — Fase Executor

## Regras da Fase Executor
- Paralelização: **permitida** para achados sem dependência entre si
- Cada achado corrigido gera **um commit individual**
- O Executor não revisa qualidade — ele implementa a correção e segue
- Se o Executor não conseguir corrigir um achado, registra como `executor_falhou` com justificativa e segue para o próximo
- Após corrigir cada achado, o `progresso.md` deve ser atualizado **antes** de avançar para o próximo

## Para cada achado aprovado, na ordem do plano:

### 8.1 — Anunciar o achado

```
[Executor] Corrigindo: ACH-{{ID}} — {{TITULO}}
Severidade: {{SEVERIDADE}}
Arquivo/Área: {{ARQUIVO_OU_AREA}}
Ação planejada: {{ACAO_PLANEJADA}}
```

### 8.2 — Implementar a correção

1. Leia os arquivos relevantes indicados na evidência do achado
2. Implemente a correção conforme a ação planejada no plano
3. Se a correção exigir alteração em múltiplos arquivos, altere todos antes de commitar
4. Se durante a correção descobrir que o achado é mais complexo do que planejado, implemente o máximo possível e registre a limitação

### 8.3 — Commitar a correção

Formato obrigatório da mensagem de commit:

```
fix(auditoria): ACH-{{ID}} — {{TITULO_CURTO}}

Domínio: {{DOMINIO}}
Run: {{RUN_ID}}
Severidade: {{SEVERIDADE}}
Classificação: {{corrigivel|corrigivel_parcial}}
```

```bash
git add {{ARQUIVOS_ALTERADOS}}
git commit -m "fix(auditoria): ACH-{{ID}} — {{TITULO_CURTO}}

Domínio: {{DOMINIO}}
Run: {{RUN_ID}}
Severidade: {{SEVERIDADE}}
Classificação: {{CLASSIFICACAO}}"
```

### 8.4 — Atualizar progresso

No `progresso.md`, atualize o achado:

```markdown
### ACH-{{ID}}
- status_executor: corrigido
- commit_executor: {{HASH_DO_COMMIT}}
- arquivos_alterados:
  - {{LISTA_DE_ARQUIVOS}}
- descricao_correcao: {{O_QUE_FOI_FEITO}}
- observacoes: {{LIMITACOES_OU_NOTAS_SE_HOUVER}}
```

Atualize também:
- `ultima_atualizacao` no cabeçalho
- `corrigidos_executor` no resumo
- `pendentes` no resumo

### 8.5 — Se o Executor falhar em um achado

```markdown
### ACH-{{ID}}
- status_executor: executor_falhou
- commit_executor: none
- motivo_falha: {{JUSTIFICATIVA_TECNICA_DETALHADA}}
- observacoes: {{CONTEXTO_ADICIONAL}}
```

O Executor **não para** quando falha em um achado individual. Registra e segue para o próximo. O Revisor tratará as falhas do Executor.

---

# Etapa 9 — Transição Executor → Revisor

Quando o Executor concluir todos os achados aprovados:

1. Atualize `progresso.md`:
   - `fase_atual: revisor`
   - `ultima_atualizacao: {{TIMESTAMP}}`

2. Commite a atualização:
```bash
git add /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/progresso.md
git commit -m "chore(auditoria): fase executor concluída — transição para revisor"
```

3. Informe o usuário:

```
Fase Executor concluída.

Achados corrigidos: {{N}}
Achados com falha do executor: {{N}}

Iniciando Fase Revisor.
Modo: sequencial, achado por achado, sem paralelização.
```

4. Prossiga **automaticamente** para a Etapa 10. Não aguarde confirmação do usuário.

---

# Etapa 10 — Fase Revisor

## GUARDRAILS ATIVOS — REFORÇO OBRIGATÓRIO

Antes de iniciar a revisão, releia as Restrições da Fase Revisor definidas no início deste prompt. Estas regras se sobrepõem a qualquer otimização, sugestão de paralelização ou atalho.

- **PROIBIDO paralelizar.** Um achado por vez, sequencialmente.
- **PROIBIDO usar modelo inferior ao Opus.**
- **PROIBIDO pular achados.**
- **PROIBIDO aceitar correção incompleta.**
- **OBRIGATÓRIO usar git diff para revisar.**

## Para cada achado aprovado, na ordem do plano:

### 10.1 — Anunciar a revisão

```
[Revisor] Revisando: ACH-{{ID}} — {{TITULO}}
Commit do Executor: {{HASH}}
```

### 10.2 — Obter o diff do commit

```bash
git diff {{HASH}}^..{{HASH}}
```

Se o achado teve `status_executor: executor_falhou`, o Revisor deve:
1. Ler o achado original completo
2. Analisar por que o Executor falhou
3. Tentar implementar a correção diretamente
4. Se conseguir, commitar com prefixo `review-fix`
5. Se não conseguir, registrar como `revisao_falhou` com justificativa detalhada

### 10.3 — Cruzar as três fontes

O Revisor deve verificar:

**(a) O achado original** — Reler o achado em `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/achados.md`:
- Qual era o problema descrito?
- Qual era a evidência?
- Qual era a recomendação?

**(b) O diff do Executor** — Analisar o que foi alterado:
- A alteração endereça o problema descrito no achado?
- A alteração é completa ou parcial?
- A alteração introduz efeitos colaterais visíveis?

**(c) O código atual** — Verificar o estado final do trecho afetado:
- O código está correto e funcional?
- O padrão de correção é consistente com o restante do código?
- Há regressão visível?

### 10.4 — Resultado da revisão

#### Se a correção está correta e completa

Atualize `progresso.md`:

```markdown
### ACH-{{ID}}
- status_revisor: aprovado
- commit_revisor: none
- resultado_revisao: correção completa e consistente
```

#### Se a correção tem discrepância ou está incompleta

O Revisor **corrige diretamente no código**. Não devolve ao Executor.

1. Implemente a correção ou complemento necessário
2. Commite com formato obrigatório:

```
review-fix(auditoria): ACH-{{ID}} — {{DESCRICAO_DA_CORRECAO_DO_REVISOR}}

Domínio: {{DOMINIO}}
Run: {{RUN_ID}}
Motivo: {{discrepancia|incompleto|efeito_colateral|regressao}}
```

3. Atualize `progresso.md`:

```markdown
### ACH-{{ID}}
- status_revisor: corrigido_com_revisao
- commit_revisor: {{HASH_DO_COMMIT_DO_REVISOR}}
- discrepancia_encontrada: {{DESCRICAO_DO_QUE_ESTAVA_ERRADO}}
- correcao_aplicada: {{O_QUE_O_REVISOR_FEZ}}
```

#### Se o Executor falhou e o Revisor também não consegue corrigir

```markdown
### ACH-{{ID}}
- status_revisor: revisao_falhou
- commit_revisor: none
- motivo_falha_executor: {{MOTIVO_ORIGINAL}}
- motivo_falha_revisor: {{POR_QUE_O_REVISOR_TAMBEM_NAO_CONSEGUIU}}
- acao_requerida: intervenção manual do usuário
```

### 10.5 — Persistir progresso após cada achado revisado

Após cada revisão individual:
- Atualize `progresso.md` com o resultado da revisão
- Atualize `revisados_revisor` e `corrigidos_pelo_revisor` no resumo
- Atualize `ultima_atualizacao`

**Não avance para o próximo achado sem persistir.**

---

# Etapa 11 — Validação técnica pós-correção

Quando a Fase Revisor concluir todos os achados:

## 11.1 — Type check

```bash
npx tsc --noEmit
```

Se o projeto não usar TypeScript ou não tiver `tsconfig.json`, registre `nao_aplicavel` e prossiga para o build.

## 11.2 — Build

Execute o comando de build do projeto. Identifique o comando correto verificando:
1. `package.json` → scripts.build
2. `Makefile` → target build
3. Outro mecanismo de build visível no projeto

```bash
npm run build
```

(ou o comando equivalente identificado)

## 11.3 — Tratamento de falhas

### Se type check ou build falhar

1. Analise o erro reportado
2. Implemente a correção necessária
3. Commite com formato:

```
fix(auditoria): corrigir erro de {{type-check|build}} pós-correção

Erro: {{DESCRICAO_RESUMIDA_DO_ERRO}}
```

4. Execute novamente o type check e/ou build
5. Registre a tentativa no `relatorio-correcao.md` em `tentativas_de_correcao_build`

### Limite de tentativas: 3

Se após 3 tentativas o type check ou build ainda falhar:

1. Registre bloqueio no `progresso.md`:

```markdown
## Bloqueio de Build
- tipo: {{type_check|build}}
- erro: {{MENSAGEM_DE_ERRO_COMPLETA}}
- tentativas: 3
- status: bloqueado
- acao_requerida: intervenção manual do usuário
```

2. Informe o usuário:

```
Validação técnica bloqueada após 3 tentativas.

Tipo: {{type_check|build}}
Erro persistente:
{{MENSAGEM_DE_ERRO}}

As correções de achados foram aplicadas e commitadas.
O build precisa de intervenção manual para resolver este erro.

A branch fix/{{DOMINIO}}/{{RUN_ID}} está preservada com todas as correções.
```

3. Prossiga para a geração do relatório final, registrando o bloqueio.

---

# Etapa 12 — Geração do relatório final de correção

Atualize `/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/relatorio-correcao.md`:

```markdown
# Relatório de Correção

## Identificação
- dominio: {{DOMINIO}}
- run_id: {{RUN_ID}}
- branch: fix/{{DOMINIO}}/{{RUN_ID}}
- data_inicio: {{TIMESTAMP_INICIO}}
- data_conclusao: {{TIMESTAMP_CONCLUSAO}}
- ultima_atualizacao: {{TIMESTAMP_CONCLUSAO}}
- status: {{concluido|concluido_com_bloqueio_build}}

## Resumo Executivo
{{RESUMO_CLARO_DO_QUE_FOI_FEITO_EM_2_A_5_LINHAS}}

## Estatísticas
- total_achados_na_run: {{N}}
- aprovados_para_correcao: {{N}}
- corrigidos_pelo_executor: {{N}}
- aprovados_pelo_revisor_sem_alteracao: {{N}}
- corrigidos_pelo_revisor: {{N}}
- falha_executor_resolvida_pelo_revisor: {{N}}
- nao_corrigiveis: {{N}}
- nao_aprovados: {{N}}
- falha_total (executor + revisor falharam): {{N}}
- taxa_de_acerto_do_executor: {{PERCENTUAL}}

## Validação Técnica
- type_check: {{passou|falhou|nao_aplicavel}}
- build: {{passou|falhou|nao_aplicavel}}
- tentativas_de_correcao_build: {{N}}
- bloqueio_build: {{sim|nao}}
- erro_persistente: {{DESCRICAO_SE_HOUVER}}

## Achados Corrigidos (Executor acertou de primeira)
{{LISTA_COM_ACH_ID_TITULO_SEVERIDADE}}

## Achados Corrigidos com Intervenção do Revisor
{{LISTA_COM_ACH_ID_TITULO_DISCREPANCIA_ENCONTRADA}}

## Achados Parciais (requerem validação humana)
{{LISTA_COM_ACH_ID_TITULO_O_QUE_FOI_FEITO_O_QUE_FALTA}}

## Achados Não Corrigíveis
{{LISTA_COM_ACH_ID_TITULO_MOTIVO_ACAO_RECOMENDADA}}

## Achados Não Aprovados pelo Usuário
{{LISTA_COM_ACH_ID_TITULO}}

## Achados com Falha Total
{{LISTA_COM_ACH_ID_TITULO_MOTIVO_EXECUTOR_MOTIVO_REVISOR}}

## Commits Gerados
{{LISTA_ORDENADA_DE_TODOS_OS_COMMITS_COM_HASH_TIPO_E_ACH_ID}}

## Merge
- status_merge: pendente
- branch_origem: fix/{{DOMINIO}}/{{RUN_ID}}
- branch_destino: main
- aprovado_por_usuario: nao
```

Commite o relatório:

```bash
git add /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/
git commit -m "chore(auditoria): relatório final de correção da run {{RUN_ID}}"
```

---

# Etapa 12.1 — Regeneração do relatório consolidado

As correções aplicadas nesta run alteraram o **status** dos achados (de `aberto`/`confirmado` para `resolvido` ou similar). Para que dashboards externos (Framework-Dashboard) reflitam o novo estado, regenere `report-consolidado.{md,json}`.

Execute a partir da raiz do projeto-alvo:

```bash
"{{RAIZ_PROJETO_ALVO}}/.audkit" report "{{RAIZ_PROJETO_ALVO}}"
```

Onde `{{RAIZ_PROJETO_ALVO}}` é o caminho absoluto da raiz do repositório auditado (o diretório que contém `/Auditoria/`).

**Tratamento de erro:**

- Se `.audkit` não existir (instalação pré-v3.3.0): pule esta etapa silenciosamente. A correção em si está concluída. O relatório consolidado pode ser gerado manualmente mais tarde.
- Se `.audkit` existir mas falhar: registre no relatório de correção uma linha sinalizando a falha (`report-consolidado.json não foi regenerado: <erro>`) e siga para a Etapa 13.

**Commit do report regenerado:**

Após a geração bem-sucedida, adicione o JSON/MD ao commit do relatório de correção (se ainda na branch) ou ao próximo commit na branch de correção:

```bash
git add Auditoria/_framework/report-consolidado.json Auditoria/_framework/report-consolidado.md
git commit -m "chore(auditoria): regenera relatório consolidado após correções da run {{RUN_ID}}"
```

---

# Etapa 13 — Solicitação de merge

Apresente o resumo final ao usuário:

```
Correção concluída.

Domínio:    {{DOMINIO}}
Run:        {{RUN_ID}}
Branch:     fix/{{DOMINIO}}/{{RUN_ID}}

Resultado:
- Achados corrigidos:                    {{N}}
- Corrigidos com intervenção do revisor: {{N}}
- Parciais (validação humana):           {{N}}
- Não corrigíveis:                       {{N}}
- Não aprovados:                         {{N}}
- Falha total:                           {{N}}

Validação:
- Type check: {{RESULTADO}}
- Build:      {{RESULTADO}}

Taxa de acerto do executor: {{PERCENTUAL}}

Total de commits: {{N}}

Deseja fazer merge da branch fix/{{DOMINIO}}/{{RUN_ID}} na main?
```

### Se o usuário aprovar o merge

```bash
git checkout main
git merge fix/{{DOMINIO}}/{{RUN_ID}} --no-ff -m "merge(auditoria): correção completa da run {{RUN_ID}} do domínio {{DOMINIO}}"
```

Atualize o `relatorio-correcao.md`:
```markdown
## Merge
- status_merge: concluido
- branch_origem: fix/{{DOMINIO}}/{{RUN_ID}}
- branch_destino: main
- aprovado_por_usuario: sim
- data_merge: {{TIMESTAMP}}
```

Informe:

```
Merge concluído com sucesso.

Branch fix/{{DOMINIO}}/{{RUN_ID}} → main

O relatório completo da correção está em:
/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/relatorio-correcao.md
```

### Se o usuário recusar o merge

```
Merge não realizado. A branch fix/{{DOMINIO}}/{{RUN_ID}} está preservada.

Você pode:
- Revisar as mudanças manualmente
- Fazer merge quando desejar com:
  git checkout main
  git merge fix/{{DOMINIO}}/{{RUN_ID}} --no-ff
- Ou descartar com:
  git branch -D fix/{{DOMINIO}}/{{RUN_ID}}

O relatório completo da correção está em:
/Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/relatorio-correcao.md
```

---

# Regras gerais de execução

1. Não corrigir achados sem plano aprovado pelo usuário.
2. Não pular achados sem justificativa técnica registrada.
3. Não marcar achado como corrigido sem correção real no código.
4. Não modificar os arquivos originais da run arquivada.
5. Cada achado corrigido gera exatamente um commit com mensagem padronizada.
6. O Executor pode paralelizar. O Revisor nunca.
7. O Revisor usa git diff. Não basta olhar o arquivo final.
8. O Revisor corrige discrepâncias diretamente. Não devolve ao Executor.
9. Commits do Revisor usam prefixo `review-fix`. Commits do Executor usam prefixo `fix`.
10. Persistir progresso após cada achado — tanto na Fase Executor quanto na Fase Revisor.
11. Se o build falhar, tentar corrigir até 3 vezes. Após 3 falhas, registrar bloqueio.
12. Não fazer merge sem autorização explícita do usuário.
13. O estado oficial da correção está nos arquivos — nunca na memória da conversa.
14. Se a execução for interrompida, o `progresso.md` deve conter informação suficiente para retomada completa.
15. Não rodar lint, testes E2E ou testes unitários automaticamente.

---

# Critério de conclusão desta execução

Esta execução só pode ser encerrada com sucesso quando:

1. Todos os achados aprovados foram processados pelo Executor
2. Todos os achados aprovados foram revisados pelo Revisor
3. Type check e build foram executados (com resultado registrado)
4. O `progresso.md` está completo e atualizado
5. O `relatorio-correcao.md` está preenchido
6. O usuário foi informado do resultado e consultado sobre o merge

Em nenhuma hipótese a execução deve encerrar com:
- achado aprovado sem processamento do Executor
- achado processado pelo Executor sem revisão do Revisor
- progresso não persistido
- relatório de correção não gerado
- resultado de type check ou build não registrado
