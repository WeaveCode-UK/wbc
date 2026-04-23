# Progresso da Correção

## Identificação
- dominio: supply-chain-dependencias
- run_id: 2026-04-19_21-11-51
- branch: fix/supply-chain-dependencias/2026-04-19_21-11-51
- data_inicio: 2026-04-23 22:40:54
- ultima_atualizacao: 2026-04-23 22:40:54
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 16
- corrigidos_executor: 0
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 16

## Achados

### ACH-001
- titulo: Vulnerabilidade crítica (RCE) em protobufjs < 7.5.5 via OpenTelemetry
- severidade: critico
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-002
- titulo: next-auth em versão beta (5.0.0-beta.30)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: rollback/GA é decisão humana; correção é documental

### ACH-003
- titulo: Sem pnpm audit no CI
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: depende de ACH-001/010/011

### ACH-004
- titulo: Imagens Docker sem digest pinning
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-005
- titulo: Sem SBOM / attestations de build
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-006
- titulo: Dependabot sem docker-ecosystem
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-007
- titulo: Sem política de licenças
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-008
- titulo: Overrides sem matriz de compatibilidade
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-009
- titulo: Ausência de verificação de integridade de lockfile
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-010
- titulo: picomatch vulnerável em tooling
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-011
- titulo: Vite 8.0.x path traversal em sourcemaps
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-012
- titulo: next-intl open redirect
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: migração 3→4 é breaking; correção documenta + ajusta constraint

### ACH-013
- titulo: Deprecated packages (stubs, uuid<7, rimraf<4, glob antigo)
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-014
- titulo: .nvmrc e Dockerfile usam tag 20 (floating)
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-015
- titulo: prepare husky roda em pnpm install
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: correção documental

### ACH-016
- titulo: Ausência de transparência/matriz de peer-dependencies
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none
