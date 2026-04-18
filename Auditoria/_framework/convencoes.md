# Convenções do Framework de Auditoria

## Objetivo
Definir padrões fixos de nomenclatura, formatação e organização para evitar divergência estrutural entre execuções.

## Convenções de Diretórios
1. Todos os diretórios do framework devem usar letras minúsculas.
2. Usar hífen (`-`) para separar palavras quando necessário.
3. Não usar espaços em nomes de diretórios ou arquivos.
4. Não usar variações paralelas de um mesmo domínio.

## Convenções de Domínio
Os domínios oficiais são apenas os listados em `domains.md`.

Não criar:
- aliases
- abreviações não oficiais
- duplicatas com capitalização diferente
- novos domínios sem revisão da convenção oficial

## Convenções de Arquivos
Arquivos padronizados por domínio:
- `metadata.md`
- `acompanhamento.md`
- `achados.md`
- `relatorio-final.md`
- `runs-index.md`

Arquivos do núcleo:
- `framework.md`
- `convencoes.md`
- `lifecycle.md`
- `domains.md`
- `execution-rules.md`
- `state-machine.md`
- `glossario.md`
- `checklist-global.md`
- `status-geral.md`
- `bootstrap-report.md`
- `playbook-seed-report.md`

Arquivos de playbook:
- `index.md`
- `*.playbook.md`

## Convenção de Run ID
Formato oficial:
`YYYY-MM-DD_HH-mm-ss`

Exemplo:
`2026-03-22_20-15-00`

## Convenção de Idioma
1. O framework deve manter consistência de idioma.
2. Os nomes técnicos oficiais dos arquivos e diretórios permanecem fixos.
3. O conteúdo textual pode ser mantido em português técnico claro.

## Convenção de Status
### Status de run
- not_started
- in_progress
- blocked
- ready_for_finalize
- completed
- archived

### Status de achado
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

### Severidade
- critico
- alto
- medio
- baixo
- informativo

## Convenção de Timestamps
Quando necessário, usar:
`YYYY-MM-DD HH:mm:ss`

Exemplo:
`2026-03-22 20:15:00`

## Convenção de Ordem
1. Índices e históricos devem preferir ordem da run mais recente para a mais antiga.
2. Fases planejadas devem ser ordenadas numericamente.
3. Achados devem ser numerados sequencialmente:
   - `ACH-001`
   - `ACH-002`
   - `ACH-003`

## Convenção de Escrita
1. Usar linguagem objetiva.
2. Evitar texto excessivamente narrativo.
3. Não escrever opiniões vagas sem evidência.
4. Separar claramente:
   - evidência
   - impacto
   - recomendação
5. Sempre registrar próximo passo de forma explícita.

## Convenção de Integridade
1. Não sobrescrever histórico.
2. Não apagar runs antigas.
3. Não alterar manualmente a estrutura canônica sem revisão explícita do framework.
4. O Bootstrap Core não deve sobrescrever playbooks já semeados de forma compatível.
5. O Seed de Playbooks não deve alterar artefatos históricos de runs.
