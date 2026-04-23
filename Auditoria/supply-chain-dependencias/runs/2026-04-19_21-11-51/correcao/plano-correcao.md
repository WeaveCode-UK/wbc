# Plano de Correção — supply-chain-dependencias

## Identificação
- dominio: supply-chain-dependencias
- run_id: 2026-04-19_21-11-51
- data_geracao: 2026-04-23 22:40:54
- total_achados: 16
- corrigiveis: 14
- corrigiveis_parciais: 2
- nao_corrigiveis: 0

## Ordem de Execução

### 1. ACH-001 — Override protobufjs ≥ 7.5.5 (RCE crítica)
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: package.json (pnpm.overrides)
- acao_planejada: adicionar override "protobufjs": ">=7.5.5" no package.json root; regenerar lockfile
- dependencias: nenhuma
- justificativa_ordem: crítico; precede ACH-003 (pnpm audit CI)
- risco_da_correcao: baixo — override transitivo

### 2. ACH-010 — Override picomatch vulnerável
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: package.json (pnpm.overrides)
- acao_planejada: override "picomatch": ">=4.0.3"; pnpm dedupe
- dependencias: nenhuma
- justificativa_ordem: proximidade (mesmo package.json) e pré-audit CI
- risco_da_correcao: baixo

### 3. ACH-011 — Bump @vitejs/plugin-react (vite path traversal)
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: package.json (devDependencies)
- acao_planejada: bump "@vitejs/plugin-react": "^6.0.2"; override "vite": ">=8.0.5"
- dependencias: nenhuma
- justificativa_ordem: proximidade (mesmo package.json)
- risco_da_correcao: baixo

### 4. ACH-012 — next-intl open redirect (PARCIAL)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/web/package.json; docs/migrations/next-intl-v4.md
- acao_planejada: criar doc de migração 3.x→4.x; bump constraint para ^4.9.1; não executar migração de API (breaking changes exigem validação humana)
- dependencias: nenhuma
- justificativa_ordem: agrupar com ajustes de package.json
- risco_da_correcao: alto — type-check pode falhar; migração da API é manual

### 5. ACH-013 — Remover deprecated packages
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: package.json root; apps/*/package.json
- acao_planejada: remover @types/bcryptjs e @types/ioredis redundantes; bump rimraf/glob/uuid
- dependencias: nenhuma
- justificativa_ordem: proximidade
- risco_da_correcao: baixo

### 6. ACH-008 — Documentar pnpm.overrides
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: docs/OVERRIDES.md
- acao_planejada: criar doc explicando rationale de cada override (incluindo novos de ACH-001/010/011)
- dependencias: ACH-001, ACH-010, ACH-011
- justificativa_ordem: executa após overrides estarem consolidados
- risco_da_correcao: nulo (doc)

### 7. ACH-002 — Documentar risco next-auth beta (PARCIAL)
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/AUTH-NEXTAUTH-BETA.md; .github/CODEOWNERS
- acao_planejada: doc com checklist de validação antes de bumps; CODEOWNERS cobrindo auth paths. Rollback/GA é decisão humana
- dependencias: nenhuma
- justificativa_ordem: agrupa docs/ e .github/CODEOWNERS
- risco_da_correcao: nulo

### 8. ACH-015 — Documentar revisão de husky hooks
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: docs/SECURITY-HUSKY.md; .github/CODEOWNERS
- acao_planejada: doc sobre risco de .husky/ adulterado; CODEOWNERS cobre .husky/**
- dependencias: nenhuma
- justificativa_ordem: proximidade com ACH-002 (mesmo CODEOWNERS)
- risco_da_correcao: nulo

### 9. ACH-004 — Pin Docker images por digest
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: docker-compose.prod.yml; deploy/Dockerfile.web; deploy/Dockerfile.worker
- acao_planejada: substituir tags por image@sha256:...; comentar cada pin com tag humanamente legível
- dependencias: nenhuma
- justificativa_ordem: começa bloco docker/infra
- risco_da_correcao: médio — digest errado quebra build; usaremos digests oficiais publicados

### 10. ACH-014 — Pin Node.js minor version
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: .nvmrc; deploy/Dockerfile.web; deploy/Dockerfile.worker; .github/workflows/ci.yml
- acao_planejada: .nvmrc=20.18.1; Dockerfiles FROM node:20.18.1-alpine@sha256 (combinado com ACH-004); atualizar node-version nos workflows
- dependencias: coexiste com ACH-004 (mesma linha em Dockerfiles)
- justificativa_ordem: proximidade com ACH-004
- risco_da_correcao: baixo

### 11. ACH-006 — Dependabot: docker-ecosystem + grupos
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: .github/dependabot.yml
- acao_planejada: adicionar docker em /deploy/ e / (compose); grupo major separado com reviewer humano
- dependencias: nenhuma
- justificativa_ordem: após blocos docker (ACH-004/014) para alinhar políticas
- risco_da_correcao: nulo

### 12. ACH-007 — Política de licenças
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: docs/LICENSING.md; .github/workflows/ci.yml; package.json (script)
- acao_planejada: doc LICENSING.md (allowlist MIT/Apache/BSD/ISC); script license:check com license-checker-rseidelsohn; job não-bloqueante inicialmente
- dependencias: nenhuma
- justificativa_ordem: prepara CI para bloco final de checks
- risco_da_correcao: baixo

### 13. ACH-003 — pnpm audit job em CI
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: .github/workflows/ci.yml
- acao_planejada: job security-audit com pnpm audit --audit-level high --prod
- dependencias: ACH-001, ACH-010, ACH-011
- justificativa_ordem: executa após todas as CVEs estarem mitigadas
- risco_da_correcao: médio — se alguma CVE sobrar, o job falha e bloqueia merges

### 14. ACH-005 — SBOM + cosign + attestations
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: .github/workflows/docker-images.yml ou ci.yml; deploy/cosign.pub
- acao_planejada: Syft (CycloneDX); cosign keyless (OIDC); actions/attest-build-provenance@v1
- dependencias: ACH-004 (recomendado)
- justificativa_ordem: cadeia docker + CI
- risco_da_correcao: médio — requer OIDC habilitado no repo

### 15. ACH-009 — Verificação de integridade de lockfile
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: .github/workflows/ci.yml; docs/integrity/lockfile.sha256
- acao_planejada: step CI comparando sha256 do pnpm-lock.yaml; GitHub Dependency Review Action em PR
- dependencias: nenhuma
- justificativa_ordem: finaliza bloco CI
- risco_da_correcao: baixo

### 16. ACH-016 — Strict peer-deps job não-bloqueante
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: .github/workflows/ci.yml
- acao_planejada: job peer-deps-report com pnpm install --strict-peer-dependencies; continue-on-error: true; artifact
- dependencias: nenhuma
- justificativa_ordem: finaliza bloco CI
- risco_da_correcao: nulo

## Achados Não Corrigíveis
Nenhum.

## Resumo do Plano
- Total a corrigir: 14
- Total parcial (requer validação humana após correção): 2 (ACH-002, ACH-012)
- Total não corrigível (ação humana necessária): 0
- Estimativa de commits: 18+ (16 achados + init + relatório final)
