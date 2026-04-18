---
kind: prompt
id: begin
version: 1
name: orquestrador
requires:
  - prompt-01a-v2
  - prompt-01b-v2
  - prompt-02-v4
  - prompt-03-v4
  - prompt-04-v2
  - prompt-05-v1
---

# BEGIN — Orquestrador do Framework de Auditoria WeaveCode

Você é um agente local operando diretamente no repositório.

Sua tarefa é **orquestrar a execução completa do Framework de Auditoria**, desde o setup inicial até a correção de achados, utilizando os prompts oficiais do framework como instruções de cada etapa.

Este é o **único prompt que o usuário precisa colar**. Todos os demais prompts são lidos automaticamente pelo orquestrador a partir do sistema de arquivos.

---

# Regra máxima desta execução

## O que você deve fazer
1. Localizar os prompts oficiais do framework no repositório
2. Detectar o estado atual do framework lendo os arquivos de controle
3. Executar ou retomar o pipeline na etapa correta
4. Carregar **um prompt por vez** — nunca múltiplos simultaneamente
5. Seguir a sequência oficial: Setup → Auditoria → Correção
6. Após cada domínio auditado, perguntar se o usuário deseja corrigir antes de avançar
7. Persistir estado entre etapas usando os arquivos do framework

## O que você **nunca deve fazer**
- Carregar mais de um prompt simultaneamente na memória
- Inventar fases, domínios ou procedimentos que não estejam nos prompts oficiais
- Pular etapas obrigatórias sem justificativa
- Modificar o conteúdo dos prompts oficiais
- Continuar após erro crítico sem informar o usuário
- Fazer suposições sobre o estado do framework sem ler os arquivos de controle
- Abrir mais de uma run de auditoria simultaneamente

---

# Etapa 0 — Localizar os prompts oficiais

Os prompts oficiais do framework podem estar em dois locais possíveis, verificados nesta ordem:

### Local 1 — Já dentro do framework (execução normal ou retomada)
`/Auditoria/_framework/prompts/`

### Local 2 — Pasta-kit na raiz do projeto (primeira execução)
Procure por uma pasta na raiz do repositório que contenha os 6 arquivos de prompt. Nomes possíveis da pasta-kit (verificar nesta ordem):
- `auditoria-kit/`
- `auditoria-prompts/`
- `.auditoria/`

### Arquivos obrigatórios (6 prompts)
Independente do local, devem existir arquivos com nomes que contenham:
- `prompt-01a` (Bootstrap Core)
- `prompt-01b` (Seed Playbooks)
- `prompt-02` (Iniciar Run)
- `prompt-03` (Executar Run)
- `prompt-04` (Finalizar Run)
- `prompt-05` (Corrigir Achados)

Os nomes exatos podem variar (podem ter sufixos como `-framework-auditoria-v2.md`), mas o prefixo identificador (`prompt-01a`, `prompt-01b`, etc.) deve estar presente.

### Se encontrar no Local 1
Os prompts já estão no lugar certo. Prossiga para a Etapa 1.

### Se encontrar no Local 2 mas não no Local 1
Os prompts serão movidos para dentro do framework automaticamente pelo Bootstrap Core (Etapa 2). Registre o caminho da pasta-kit para uso na Etapa 2.

### Se não encontrar em nenhum local

```
Prompts do framework não encontrados.

Esperado em:
- /Auditoria/_framework/prompts/ (execução normal)
- auditoria-kit/ na raiz (primeira execução)
- auditoria-prompts/ na raiz (primeira execução)
- .auditoria/ na raiz (primeira execução)

Coloque os 6 arquivos de prompt em uma dessas pastas e execute o BEGIN novamente.
```

**Encerre sem alterar arquivos.**

---

# Etapa 1 — Detecção de estado e decisão de rota

Verifique o estado atual do framework:

## Cenário A — Framework não existe
O diretório `/Auditoria/` não existe ou `/Auditoria/_framework/` não existe.

**Rota: iniciar pelo Setup (Etapa 2).**

## Cenário B — Bootstrap Core existe, mas playbooks não
`/Auditoria/_framework/` existe e contém os arquivos centrais, mas `/Auditoria/_framework/playbooks/` não existe ou está vazio.

Verifique `/Auditoria/_framework/status-geral.md`:
- Se `status_playbooks_seed` é `pending` ou ausente → **Rota: Etapa 3 (Seed Playbooks).**
- Se `status_playbooks_seed` é `completed` → inconsistência. Informe o usuário e sugira re-executar o seed.

## Cenário C — Framework completo, nenhuma run ativa
`/Auditoria/_framework/` existe, playbooks existem, e `status-geral.md` mostra todos os domínios com `status_current: not_started`.

Verifique se há correções interrompidas (pasta `correcao/` com `status: em_andamento` em alguma run).

- Se houver correção interrompida → **Rota: Etapa 7 (retomar correção).**
- Se não → **Rota: Etapa 4 (Seleção de domínios).**

## Cenário D — Run ativa encontrada
Algum domínio em `status-geral.md` está com `status_current: in_progress` ou `status_current: blocked`.

**Rota: Etapa 5 (retomar execução da run ativa).**

## Cenário E — Run pronta para finalizar
Algum domínio está com `status_current: ready_for_finalize`.

**Rota: Etapa 6 (finalizar run).**

---

# Etapa 2 — Setup: Bootstrap Core

Informe o usuário:

```
Framework de auditoria não encontrado neste repositório.
Iniciando setup: Bootstrap Core.
```

### 2.1 — Carregar e executar o Prompt 01A

Leia o conteúdo completo do arquivo `prompt-01a*` do local identificado na Etapa 0.

Execute as instruções do Prompt 01A integralmente, como se ele tivesse sido colado diretamente pelo usuário.

### 2.2 — Mover prompts para dentro do framework

Após o Bootstrap Core criar `/Auditoria/_framework/`, crie a pasta:
`/Auditoria/_framework/prompts/`

Copie todos os 7 arquivos da pasta-kit para `/Auditoria/_framework/prompts/`:
- os 6 prompts (01a, 01b, 02, 03, 04, 05)
- o próprio BEGIN

Verifique que todos os 7 arquivos foram copiados com sucesso.

### 2.3 — Remover a pasta-kit da raiz

Após confirmar que todos os 7 arquivos estão em `/Auditoria/_framework/prompts/`, remova a pasta-kit original da raiz do projeto:

```bash
rm -rf {{PASTA_KIT_ORIGINAL}}
```

Isso evita duplicação. A partir deste ponto, os prompts moram exclusivamente dentro de `/Auditoria/_framework/prompts/`.

### 2.4 — Confirmar e avançar

```
Bootstrap Core concluído.
Prompts movidos para /Auditoria/_framework/prompts/.
Pasta auditoria-kit/ removida da raiz.

Avançando para: Seed Playbooks.
```

Prossiga automaticamente para a Etapa 3.

---

# Etapa 3 — Setup: Seed Playbooks

### 3.1 — Carregar e executar o Prompt 01B

Leia o conteúdo completo do arquivo `prompt-01b*` de `/Auditoria/_framework/prompts/`.

Execute as instruções do Prompt 01B integralmente.

### 3.2 — Remover a pasta `playbook/` da raiz

Após confirmar que os 15 playbooks + `index.md` foram criados em `/Auditoria/_framework/playbooks/` pelo Prompt 01B, remova a pasta `playbook/` original da raiz do projeto:

```bash
rm -rf playbook
```

A pasta `playbook/` era cópia transitória usada apenas como fonte durante o Seed. A partir deste ponto, os playbooks oficiais moram exclusivamente em `/Auditoria/_framework/playbooks/`. Se a pasta `playbook/` não existir (instalações antigas já higienizadas), apenas siga.

### 3.3 — Verificar wrapper `.audkit`

Verifique se o arquivo `.audkit` existe na raiz do projeto:

```bash
test -x "$(pwd)/.audkit" && echo "audkit OK" || echo "audkit MISSING"
```

Se **presente**: Prompts 03, 04 e 05 vão gerar/atualizar `report-consolidado.json` automaticamente durante e após a auditoria. Dashboards externos (Framework-Dashboard) podem monitorar o progresso.

Se **ausente**: informe o usuário (não é bloqueador, a auditoria funciona sem isso):

```
⚠️  O wrapper .audkit não está presente na raiz do projeto.
Isso significa que o report-consolidado.json NÃO será gerado automaticamente
durante a auditoria, e dashboards externos não verão o progresso.

Para ativar: rode `<FRAMEWORK_PATH>/install.sh .` na raiz do projeto
(preserva /Auditoria/ e tudo que já foi criado).

Você pode continuar a auditoria normalmente — só o reporting automático
ficará desabilitado.
```

Continue a execução independentemente da resposta.

### 3.4 — Confirmar e avançar

```
Seed Playbooks concluído. Framework pronto para auditorias.

Avançando para: Seleção de domínios.
```

Prossiga automaticamente para a Etapa 4.

---

# Etapa 4 — Seleção de domínios e modo de execução

Apresente ao usuário:

```
Framework de Auditoria pronto.

Domínios disponíveis:
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
12. compliance-privacidade
13. supply-chain-dependencias
14. custos-finops
15. documentacao-runbooks
```

Pergunte ao usuário:

```
Como deseja prosseguir?

Opções:
- "todos" → auditar todos os 15 domínios em sequência
- números separados por vírgula (ex: "1, 3, 5") → auditar apenas os selecionados
- nome do domínio (ex: "seguranca") → auditar apenas esse domínio

Após cada domínio auditado, você será consultado sobre correção dos achados antes de avançar para o próximo.
```

Aguarde a resposta do usuário.

### Validação
- Se o usuário escolheu "todos": lista = todos os 15 domínios na ordem oficial
- Se o usuário escolheu domínios específicos: valide que cada um é um domínio oficial. Se algum for inválido, informe e peça correção.

Armazene a lista de domínios selecionados e prossiga para a Etapa 5 com o primeiro domínio da lista.

---

# Etapa 5 — Ciclo de auditoria por domínio

Para cada domínio na lista selecionada, execute o ciclo completo:

## 5.1 — Verificar estado do domínio

Leia `/Auditoria/_framework/status-geral.md` e verifique o `status_current` do domínio.

### Se `status_current: not_started`
Prossiga com 5.2 (Iniciar Run).

### Se `status_current: in_progress`
Run ativa encontrada. Prossiga com 5.3 (Executar Run) para retomar.

### Se `status_current: blocked`
Informe o usuário sobre o bloqueio. Pergunte se deseja tentar retomar ou pular este domínio.
- Se retomar: prossiga com 5.3.
- Se pular: registre e avance para o próximo domínio da lista.

### Se `status_current: ready_for_finalize`
Prossiga com 5.4 (Finalizar Run).

### Se o domínio já tem run finalizada (`ultima_run_finalizada` diferente de `none`) e `status_current: not_started`
Informe o usuário:

```
O domínio {{DOMINIO}} já possui auditoria finalizada (run {{ULTIMA_RUN}}).

Deseja:
1. Iniciar uma nova auditoria deste domínio
2. Pular para o próximo domínio
3. Corrigir os achados da última auditoria
```

Aguarde e prossiga conforme a escolha.

## 5.2 — Iniciar Run (Prompt 02)

Leia o conteúdo completo do arquivo `prompt-02*` de `/Auditoria/_framework/prompts/`.

Execute as instruções do Prompt 02 para o domínio atual. Quando o Prompt 02 solicitar a escolha do domínio ao usuário, **forneça automaticamente** o domínio atual da lista — não pergunte ao usuário novamente.

Ao concluir, prossiga automaticamente para 5.3.

## 5.3 — Executar Run (Prompt 03)

Leia o conteúdo completo do arquivo `prompt-03*` de `/Auditoria/_framework/prompts/`.

Execute as instruções do Prompt 03 integralmente até que a run atinja `ready_for_finalize` ou `blocked`.

### Se `ready_for_finalize`
Prossiga para 5.4.

### Se `blocked`
Informe o usuário. Pergunte se deseja:
1. Tentar resolver o bloqueio e continuar
2. Pular este domínio e ir para o próximo

Se pular, avance para o próximo domínio na lista. Não finalize a run bloqueada.

## 5.4 — Finalizar Run (Prompt 04)

Leia o conteúdo completo do arquivo `prompt-04*` de `/Auditoria/_framework/prompts/`.

Execute as instruções do Prompt 04. Quando o Prompt 04 solicitar confirmação do usuário para arquivar, **repasse a pergunta ao usuário** — não confirme automaticamente.

Ao concluir a finalização, prossiga para 5.5.

## 5.5 — Perguntar sobre correção

Após finalizar a run, pergunte ao usuário:

```
Auditoria do domínio {{DOMINIO}} finalizada e arquivada.

Deseja corrigir os achados desta auditoria agora?
- "sim" → inicia o pipeline de correção (Prompt 05)
- "não" → avança para o próximo domínio
```

### Se sim
Prossiga para a Etapa 7 (Correção).

### Se não
Avance para o próximo domínio na lista (volte para 5.1 com o próximo domínio).

---

# Etapa 6 — Finalizar run pendente (rota de retomada)

Se o orquestrador detectou uma run em `ready_for_finalize` na Etapa 1:

1. Informe o usuário qual domínio está pronto para finalizar
2. Carregue e execute o Prompt 04
3. Após finalizar, pergunte sobre correção (5.5)
4. Após resolver, retorne à Etapa 4 para que o usuário selecione domínios adicionais, se desejar

---

# Etapa 7 — Correção de achados (Prompt 05)

Leia o conteúdo completo do arquivo `prompt-05*` de `/Auditoria/_framework/prompts/`.

Execute as instruções do Prompt 05 integralmente.

O Prompt 05 possui seu próprio mecanismo de retomada (via `progresso.md`). Se a correção foi interrompida anteriormente, o Prompt 05 detectará e retomará automaticamente.

Ao concluir a correção (ou se o usuário cancelar), avance para o próximo domínio na lista (volte para 5.1 com o próximo domínio).

---

# Etapa 8 — Conclusão do pipeline

Quando todos os domínios da lista tiverem sido processados (auditados e, opcionalmente, corrigidos):

```
Pipeline de auditoria concluído.

Domínios processados:
{{LISTA_DE_DOMINIOS_COM_STATUS_DE_CADA_UM}}

Para cada domínio:
- {{DOMINIO}}: auditoria {{STATUS}} | correção {{STATUS_CORRECAO}}

Relatórios disponíveis em:
- Auditorias: /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/relatorio-final.md
- Correções: /Auditoria/{{DOMINIO}}/runs/{{RUN_ID}}/correcao/relatorio-correcao.md

Status geral do framework: /Auditoria/_framework/status-geral.md
```

---

# Regras de carregamento de prompts

## Regra 1 — Um prompt por vez
Ao carregar um prompt para execução, ele se torna a instrução ativa. Ao concluir a execução desse prompt, seu conteúdo é descartado da memória antes de carregar o próximo. Nunca mantenha dois prompts carregados simultaneamente.

## Regra 2 — Execução fiel
Execute o prompt carregado exatamente como documentado, respeitando todas as suas etapas, validações, restrições e critérios de conclusão. O orquestrador não altera, resume ou reinterpreta os prompts.

## Regra 3 — Estado nos arquivos
O estado do pipeline está nos arquivos do framework (`status-geral.md`, `metadata.md`, `progresso.md`). Se o orquestrador for interrompido e reiniciado, ele detecta o estado atual lendo esses arquivos na Etapa 1 e retoma de onde parou.

## Regra 4 — Autonomia controlada
O orquestrador avança automaticamente entre etapas de setup (01A → 01B) e entre as etapas internas de cada domínio (02 → 03 → 04). Mas sempre consulta o usuário em decisões de escopo:
- Quais domínios auditar
- Confirmação de arquivamento (Prompt 04)
- Se deseja corrigir achados
- Aprovação do plano de correção (Prompt 05)
- Aprovação de merge (Prompt 05)

## Regra 5 — Resiliência
Se qualquer etapa falhar ou bloquear:
1. Registre o estado atual nos arquivos
2. Informe o usuário com contexto claro
3. Ofereça opções: retomar, pular domínio, ou encerrar
4. Nunca deixe o framework em estado inconsistente

---

# Regras gerais de execução

1. Localizar prompts antes de qualquer ação.
2. Detectar estado do framework antes de decidir o que executar.
3. Carregar um prompt por vez — descartar antes de carregar o próximo.
4. Executar cada prompt fielmente sem alterar suas instruções.
5. Após cada domínio auditado, perguntar sobre correção.
6. Não abrir mais de uma run simultaneamente.
7. Não pular etapas de setup se o framework não estiver pronto.
8. Não confirmar automaticamente decisões que requerem aprovação do usuário.
9. Não modificar o conteúdo dos prompts oficiais.
10. Se interrompido, o estado nos arquivos deve permitir retomada completa.

---

# Critério de conclusão desta execução

O orquestrador encerra quando uma destas condições ocorrer:

1. **Pipeline completo**: todos os domínios selecionados foram auditados (e opcionalmente corrigidos), o usuário recebeu o resumo final.

2. **Encerramento voluntário**: o usuário solicitou parar. O estado atual está persistido nos arquivos e pode ser retomado rodando o BEGIN novamente.

3. **Bloqueio irrecuperável**: erro que impede continuidade (prompts não encontrados, estrutura corrompida). O usuário foi informado com contexto suficiente para resolver.

Em todos os casos, o estado do framework nos arquivos deve ser consistente e permitir retomada futura.
