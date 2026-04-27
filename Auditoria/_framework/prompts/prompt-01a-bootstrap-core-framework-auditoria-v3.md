---
kind: prompt
id: prompt-01a
version: 3
name: bootstrap-core
capability_tier: balanced
---

# Prompt 01A — Bootstrap Core do Framework de Auditoria

Você é um agente local operando diretamente no repositório do projeto-alvo.

Sua tarefa nesta execução é **somente** criar e inicializar o **Bootstrap Core** do Framework de Auditoria WeaveCode em `/Auditoria/`.

# Objetivo

Criar, na raiz do repositório, a estrutura oficial do framework em `/Auditoria/`, incluindo:

- diretórios do core e dos 16 domínios oficiais
- `audit-index.json` (estado global em JSON validado)
- 7 templates JSON dos arquivos de estado de run em `_framework/templates/`
- pasta oficial de playbooks (vazia até o Prompt 01B)
- arquivos `current/` inicializados em `not_started` para os 16 domínios oficiais
- `runs-index.json` vazio para cada domínio
- `bootstrap-report.md` com o resultado da execução (único arquivo Markdown criado)
- `playbook-seed-report.md` preparado para a etapa 01B (também em Markdown)

Você **não deve** executar auditoria técnica do projeto nesta etapa.
Você **não deve** semear os playbooks completos nesta etapa.

---

# Estado JSON-first (a partir do framework v4)

A partir do framework v4, o estado operacional é armazenado em **arquivos JSON** validados por schemas oficiais que vivem em `schemas/runtime/` no repositório do template:

| Arquivo de estado                                      | Schema                                |
|--------------------------------------------------------|---------------------------------------|
| `/Auditoria/_framework/audit-index.json`               | `audit-index.schema.json`             |
| `/Auditoria/<dominio>/current/run.json`                | `run.schema.json`                     |
| `/Auditoria/<dominio>/current/state.json`              | `state.schema.json`                   |
| `/Auditoria/<dominio>/current/findings.json`           | `findings.schema.json`                |
| `/Auditoria/<dominio>/current/report.json`             | `report.schema.json`                  |
| `/Auditoria/<dominio>/current/phase-ledger.jsonl`      | `phase-ledger.schema.json` (por linha) |
| `/Auditoria/<dominio>/runs/runs-index.json`            | `runs-index.schema.json`              |
| `/Auditoria/<dominio>/runs/<run_id>/correcao/correction.json` | `correction.schema.json`         |
| `/Auditoria/<dominio>/runs/<run_id>/correcao/correction-report.json` | `correction-report.schema.json` |

Todo arquivo JSON do framework tem o campo obrigatório `format_version: 1`.

Os únicos arquivos `.md` criados pelo Bootstrap Core são logs de setup:

- `/Auditoria/_framework/bootstrap-report.md`
- `/Auditoria/_framework/playbook-seed-report.md`

Esses dois arquivos são **append-once** e **não consumidos** por nenhum prompt operacional ou pelo dashboard — existem apenas para auditoria humana do que aconteceu durante a instalação.

---

# Regra máxima desta execução

Esta execução é **exclusivamente de Bootstrap Core**.

Você deve:

1. criar ou complementar a estrutura oficial do core
2. inicializar `audit-index.json`
3. criar os 7 templates JSON oficiais
4. inicializar os 16 domínios oficiais (current + runs com runs-index.json vazio)
5. criar a pasta oficial de playbooks (vazia)
6. registrar o resultado em `/Auditoria/_framework/bootstrap-report.md`
7. criar `/Auditoria/_framework/playbook-seed-report.md` preparado para a etapa 01B
8. encerrar

Você **não deve**:

- executar auditoria técnica de nenhum domínio
- iniciar run real
- finalizar run
- criar histórico de run finalizada
- gerar conteúdo dos 16 playbooks
- criar `/Auditoria/_framework/playbooks/index.md`
- criar arquivos `*.playbook.md`
- preencher achados técnicos reais
- modificar código-fonte do projeto fora de `/Auditoria/`, salvo o estritamente necessário para criar a própria pasta `/Auditoria/`

---

# Idempotência e preservação obrigatórias

## Regra principal

Se o framework core já existir total ou parcialmente, **preserve** tudo que já estiver compatível e apenas complemente o que faltar.

## Regras específicas

1. Se um arquivo JSON oficial já existir e validar contra o schema correspondente, **não sobrescreva**.
2. Se um arquivo JSON oficial existir mas estiver claramente quebrado (não-JSON ou inválido por schema), normalize com cuidado e registre isso em `bootstrap-report.md`.
3. Se a pasta `/Auditoria/_framework/playbooks/` já existir com conteúdo, **não altere nem apague** arquivos de playbook nesta etapa.
4. Se já existir material da etapa 01B (playbooks semeados), preserve-o.
5. Nunca apagar histórico existente em `runs/`.
6. Nunca sobrescrever runs históricas finalizadas.
7. Nunca criar domínios duplicados.
8. Nunca renomear silenciosamente estruturas preexistentes sem registrar isso no report.

## Detecção de framework legado (pré-v4)

Se você encontrar arquivos `.md` operacionais legados (`metadata.md`, `acompanhamento.md`, `achados.md`, `relatorio-final.md`, `status-geral.md`, `runs-index.md`) **na raiz do core ou em current/**:

- **NÃO os apague**.
- **NÃO os converta automaticamente para JSON**.
- Registre em `bootstrap-report.md` que o projeto está em formato legado e exige migração manual via `audkit migrate` (utilitário separado).
- Encerre a execução com `status_resultado: blocked_legacy_format`.

---

# Comportamento obrigatório antes de criar qualquer coisa

1. Verifique se já existe a pasta `/Auditoria/` na raiz do projeto-alvo.
2. Se não existir, crie.
3. Se existir, inspecione cuidadosamente a estrutura existente antes de agir.
4. Se encontrar inconsistência estrutural grave com a convenção oficial, **não improvise correção silenciosa**.
5. Em caso de conflito relevante, registre em `bootstrap-report.md` e preserve a estrutura existente o máximo possível.

## Exemplos de inconsistência relevante

- domínio oficial duplicado com grafia diferente
- múltiplas pastas equivalentes para o mesmo domínio
- `_framework/` ausente, mas subestruturas parciais conflitantes
- arquivos JSON oficiais com nomes diferentes da convenção
- coexistência de versões antigas (`.md` operacional pré-v4) e novas do core

---

# Estrutura oficial do Bootstrap Core

Crie exatamente esta estrutura. Não gerar conteúdo dos playbooks nesta etapa.

```
/Auditoria
  /_framework
    audit-index.json
    bootstrap-report.md
    playbook-seed-report.md
    /templates
      run.template.json
      state.template.json
      findings.template.json
      report.template.json
      runs-index.template.json
      correction.template.json
      correction-report.template.json
    /playbooks                           # vazio até o Prompt 01B

  /arquitetura
    /current
      run.json
      state.json
      findings.json
      report.json
      phase-ledger.jsonl                 # arquivo vazio (0 bytes)
    /runs
      runs-index.json

  /codigo-manutenibilidade
    /current
      run.json
      state.json
      findings.json
      report.json
      phase-ledger.jsonl
    /runs
      runs-index.json

  /seguranca
    /current
      run.json
      state.json
      findings.json
      report.json
      phase-ledger.jsonl
    /runs
      runs-index.json

  /apis-integracoes                     # … repetir mesma sub-estrutura
  /dados-persistencia                   # …
  /performance-escalabilidade           # …
  /confiabilidade-resiliencia           # …
  /observabilidade-operacao             # …
  /testes-qualidade                     # …
  /ui-ux-fluxos                         # …
  /infraestrutura-deploy-config         # …
  /compliance-privacidade               # …
  /supply-chain-dependencias            # …
  /custos-finops                        # …
  /documentacao-runbooks                # …
  /ai-ml-governanca                     # …
```

A sub-estrutura `current/` + `runs/` + `runs-index.json` é **idêntica** para todos os 16 domínios.

---

# Domínios oficiais (ordem canônica)

| ordem | slug                          |
|-------|-------------------------------|
| 1     | arquitetura                   |
| 2     | codigo-manutenibilidade       |
| 3     | seguranca                     |
| 4     | apis-integracoes              |
| 5     | dados-persistencia            |
| 6     | performance-escalabilidade    |
| 7     | confiabilidade-resiliencia    |
| 8     | observabilidade-operacao      |
| 9     | testes-qualidade              |
| 10    | ui-ux-fluxos                  |
| 11    | infraestrutura-deploy-config  |
| 12    | compliance-privacidade        |
| 13    | supply-chain-dependencias     |
| 14    | custos-finops                 |
| 15    | documentacao-runbooks         |
| 16    | ai-ml-governanca              |

A fonte canônica é `<projeto-alvo>/playbook/` (copiado pelo `install.sh`). Cada `<slug>.playbook.md` ali tem um frontmatter YAML com o campo `version` que você usará ao montar `audit-index.json`.

---

# Convenções obrigatórias

## Convenções de diretório

- somente letras minúsculas
- hífen para separar palavras
- nunca espaços
- nunca aliases ou variações dos domínios oficiais

## Convenção de idioma

- conteúdo textual em português técnico claro
- nomes de arquivos e diretórios fixos conforme especificação

## Convenção de run id

Formato oficial: `YYYY-MM-DD_HH-mm-ss` (ex.: `2026-04-25_14-30-00`). Quando não há run, use a string `"none"` ou `null` conforme o schema.

## Convenções de status

| Estado de run                | Onde aparece            |
|------------------------------|-------------------------|
| `not_started`                | current (nunca há run)  |
| `in_progress`                | current (run em curso)  |
| `blocked`                    | current (bloqueio aberto) |
| `ready_for_finalize`         | current (pronto p/ P04) |
| `completed`                  | runs/<run_id>/ (snapshot) |
| `archived`                   | runs/<run_id>/ (opcional) |

| Estado de achado | Significado |
|------------------|-------------|
| `aberto`         | descoberto, ainda não confirmado |
| `confirmado`     | evidência verificável |
| `mitigado`       | reduzido mas não resolvido |
| `resolvido`      | corrigido (referenciar commit) |
| `aceito`         | risco aceito explicitamente |
| `nao_aplicavel`  | não se aplica ao contexto |

| Severidade |
|------------|
| `critico`, `alto`, `medio`, `baixo`, `informativo` |

---

# 1. `/Auditoria/_framework/audit-index.json`

Estado global do framework no projeto-alvo. Substitui `status-geral.md` de versões anteriores.

Conteúdo obrigatório (preencha os 16 domínios na ordem canônica acima):

```json
{
  "format_version": 1,
  "framework_version": "4.0.0-beta.6",
  "updated_at": "{{TIMESTAMP_ISO_8601_AGORA}}",
  "playbooks_seed_status": "pending",
  "domains": [
    {
      "slug": "arquitetura",
      "ordem": 1,
      "playbook_version": "{{LIDO_DE_PLAYBOOK_FRONTMATTER}}",
      "status_current": "not_started",
      "active_run_id": null,
      "ultima_run_finalizada": null,
      "total_runs": 0,
      "last_finalized_at": null
    },
    {
      "slug": "codigo-manutenibilidade",
      "ordem": 2,
      "playbook_version": "{{LIDO_DE_PLAYBOOK_FRONTMATTER}}",
      "status_current": "not_started",
      "active_run_id": null,
      "ultima_run_finalizada": null,
      "total_runs": 0,
      "last_finalized_at": null
    }
    // ... repita para todos os 16 domínios na ordem oficial
  ]
}
```

## Como obter `playbook_version` para cada domínio

Para cada slug `<dominio>` nesta etapa, leia o arquivo `<projeto-alvo>/playbook/<dominio>.playbook.md` e extraia o campo `version` do frontmatter YAML no topo do arquivo. Use exatamente esse valor (ex.: `"1.0"`, `"2.0"`).

Se o arquivo `<projeto-alvo>/playbook/<dominio>.playbook.md` não existir, use `"0.0"` e registre o domínio em `bootstrap-report.md` na seção `Conflitos`.

## Regras

- `framework_version` deve refletir a versão atual do template (lida do `package.json` do framework no momento da execução do Bootstrap). Esta linha foi 4.0.0-alpha.0 originalmente — agora é 4.0.0-beta.1 ou superior.
- O array `domains` deve ter **exatamente 16 entradas**, na ordem canônica (1..16).
- Todos os domínios começam com `status_current: "not_started"` e contadores zerados.
- `playbooks_seed_status: "pending"` — o Prompt 01B vai marcar como `"completed"` ao terminar.
- `updated_at` é timestamp ISO 8601 do momento da execução do Bootstrap.

---

# 2. `/Auditoria/_framework/bootstrap-report.md`

Único log Markdown criado nesta etapa. Não consumido por dashboard ou prompts operacionais — serve para auditoria humana do que aconteceu durante o setup.

Conteúdo base:

```
# Bootstrap Core Report

## Identificação
- data_hora_execucao: {{TIMESTAMP_REAL_AGORA}}
- versao_framework: 4.0.0-beta.6
- status_resultado: {{completed | partial | blocked_legacy_format}}

## Estrutura Criada
- /Auditoria: {{criado | ja_existia | preservado}}
- /Auditoria/_framework: {{...}}
- /Auditoria/_framework/templates: {{...}}
- /Auditoria/_framework/playbooks: {{...}}

## audit-index.json
- criado: {{sim | nao}}
- 16 domínios populados: {{sim | nao}}
- playbook_version lido de cada playbook: {{sim | parcialmente | nao}}

## Templates JSON
- run.template.json: {{criado | preservado | falhou}}
- state.template.json: {{...}}
- findings.template.json: {{...}}
- report.template.json: {{...}}
- runs-index.template.json: {{...}}
- correction.template.json: {{...}}
- correction-report.template.json: {{...}}

## Domínios Inicializados
- arquitetura: {{criado | preservado | conflito}}
- codigo-manutenibilidade: {{...}}
- seguranca: {{...}}
- apis-integracoes: {{...}}
- dados-persistencia: {{...}}
- performance-escalabilidade: {{...}}
- confiabilidade-resiliencia: {{...}}
- observabilidade-operacao: {{...}}
- testes-qualidade: {{...}}
- ui-ux-fluxos: {{...}}
- infraestrutura-deploy-config: {{...}}
- compliance-privacidade: {{...}}
- supply-chain-dependencias: {{...}}
- custos-finops: {{...}}
- documentacao-runbooks: {{...}}
- ai-ml-governanca: {{...}}

## Conflitos ou Inconsistências Detectadas
- {{listar; "none" se nenhum}}

## Formato Legado Detectado
- {{nao | sim — descrever brevemente}}

## Resumo Final
- {{frase curta confirmando o estado final do bootstrap}}
```

---

# 3. `/Auditoria/_framework/playbook-seed-report.md`

Conteúdo base (pré-preenchido para o Prompt 01B atualizar depois):

```
# Playbook Seed Report

## Identificação
- data_hora_execucao: none
- versao_framework: 4.0.0-beta.6
- status_resultado: pending

## Status Atual
- seed_executado: nao
- total_playbooks_criados: 0
- total_playbooks_esperados: 16

## Observacoes
- none
```

---

# 4. Templates JSON em `/Auditoria/_framework/templates/`

Os 7 templates JSON canônicos vivem em `<projeto-alvo>/runtime-templates/` (copiados pelo `install.sh` ou `audkit install` a partir do repo do framework). Cada template contém placeholders `{{...}}` que o Prompt 02 (e seguintes) substituem ao instanciar para um domínio.

## 4.1 — Verificação dos 7 templates fonte

Confirme que estes arquivos existem em `<projeto-alvo>/runtime-templates/`:

- `run.template.json`
- `state.template.json`
- `findings.template.json`
- `report.template.json`
- `runs-index.template.json`
- `correction.template.json`
- `correction-report.template.json`

Se algum estiver ausente, o `install.sh` não copiou (ou o usuário deletou). Registre em `bootstrap-report.md` na seção `Conflitos` e **encerre** — não tente recriar inline (a fonte canônica é o repo do framework, não este prompt).

## 4.2 — Cópia para `/Auditoria/_framework/templates/`

Para cada um dos 7 templates, copie de `<projeto-alvo>/runtime-templates/<nome>.template.json` para `/Auditoria/_framework/templates/<nome>.template.json`.

**Substituições a aplicar durante a cópia:**

- `{{FRAMEWORK_VERSION}}` → versão atual do framework (lida do `package.json` do repo do framework — `4.0.0-beta.5` ou superior).

**Outros placeholders permanecem intactos** nos templates (`{{DOMINIO}}`, `{{TIMESTAMP_ISO_8601}}`, `{{RUN_ID}}`, `{{BRANCH}}`) — eles são substituídos pelo Prompt 02 e seguintes ao instanciar para uma run real.

**Idempotência:** se `/Auditoria/_framework/templates/<nome>.template.json` já existe e o conteúdo é byte-equivalente ao da fonte, **não sobrescreva**. Se diverge (template foi atualizado no repo via `audkit update`), **sobrescreva** — a fonte canônica em `<projeto-alvo>/runtime-templates/` sempre vence.

---

# 5. Inicialização dos 16 domínios

Para **cada um dos 16 domínios** listados na ordem canônica:

1. Crie o diretório `/Auditoria/<slug>/`.
2. Crie `/Auditoria/<slug>/current/run.json` instanciando `run.template.json` e substituindo `{{DOMINIO}}` pelo `<slug>`.
3. Crie `/Auditoria/<slug>/current/state.json` instanciando `state.template.json` (substitua `{{DOMINIO}}` e `{{TIMESTAMP_ISO_8601}}`).
4. Crie `/Auditoria/<slug>/current/findings.json` instanciando `findings.template.json`.
5. Crie `/Auditoria/<slug>/current/report.json` instanciando `report.template.json`.
6. Crie `/Auditoria/<slug>/current/phase-ledger.jsonl` como **arquivo vazio** (0 bytes).
7. Crie o diretório `/Auditoria/<slug>/runs/`.
8. Crie `/Auditoria/<slug>/runs/runs-index.json` instanciando `runs-index.template.json`.

## Regra de validação por arquivo criado

Antes de gravar cada `.json`, valide mentalmente que ele tem `format_version: 1` e o `domain` correto. JSON malformado ou com placeholder `{{...}}` não substituído é **erro** — registre em `bootstrap-report.md`.

---

# 6. Atualização final do `bootstrap-report.md`

Ao final da execução, atualize o report com:

- `data_hora_execucao`: timestamp real
- `status_resultado`: `completed` (estrutura íntegra) | `partial` (alguma falha não-crítica) | `blocked_legacy_format` (detectou MD legado)
- marque cada arquivo/domínio criado, preservado, ou conflito
- na seção `Conflitos`, descreva inconsistências encontradas
- na seção `Formato Legado Detectado`, descreva se houver `.md` operacional pré-v4
- na `Resumo Final`, escreva uma frase clara confirmando o estado

---

# 7. Regras finais do Bootstrap Core

1. Não apagar conteúdo histórico em `runs/`.
2. Não sobrescrever runs históricas finalizadas.
3. Não criar domínios duplicados.
4. Não renomear silenciosamente estruturas preexistentes sem registrar no report.
5. Não iniciar runs reais.
6. Não preencher achados técnicos do projeto.
7. Não executar auditoria de nenhum domínio nesta etapa.
8. Não criar `/Auditoria/_framework/playbooks/index.md` nesta etapa.
9. Não criar arquivos `*.playbook.md` nesta etapa.
10. Não converter automaticamente arquivos `.md` legados pré-v4 para JSON — exigir migração manual via `audkit migrate`.

---

# 8. Critério de conclusão

Esta execução só pode ser encerrada quando:

1. `/Auditoria/` existe na raiz do projeto.
2. `/Auditoria/_framework/audit-index.json` existe e tem 16 domínios populados.
3. `/Auditoria/_framework/templates/` contém os 7 templates JSON oficiais.
4. `/Auditoria/_framework/playbooks/` existe (vazia).
5. Para cada um dos 16 domínios: `current/{run,state,findings,report}.json`, `current/phase-ledger.jsonl` e `runs/runs-index.json` existem.
6. `/Auditoria/_framework/bootstrap-report.md` está atualizado com o resultado.
7. `/Auditoria/_framework/playbook-seed-report.md` existe pré-preenchido.

---

# 9. Saída esperada ao encerrar

Ao terminar:

1. **NÃO** continue para o Seed de Playbooks (etapa 01B). Encerre.
2. **NÃO** inicie runs.
3. Apenas registre o Bootstrap Core concluído em `bootstrap-report.md`.
4. Encerre a execução.
