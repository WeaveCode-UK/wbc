# Progresso da Correção

## Identificação
- dominio: supply-chain-dependencias
- run_id: 2026-04-19_21-11-51
- branch: fix/supply-chain-dependencias/2026-04-19_21-11-51
- data_inicio: 2026-04-23 22:40:54
- ultima_atualizacao: 2026-04-23 23:04:39
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 16
- corrigidos_executor: 16
- revisados_revisor: 16
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-001
- titulo: Vulnerabilidade crítica (RCE) em protobufjs < 7.5.5 via OpenTelemetry
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 6257ff7
- commit_revisor: none
- arquivos_alterados:
  - package.json
  - pnpm-lock.yaml
- descricao_correcao: adicionado override "protobufjs": ">=7.5.5"; lockfile resolveu para protobufjs@8.0.1
- observacoes: none
- nota_revisor: override presente em package.json L37; lockfile L13 confirma override ativo; todos os consumidores (grpc-js, auto-instrumentations-node) resolvem para 8.0.1; zero traços de 7.5.4 remanescentes

### ACH-002
- titulo: next-auth em versão beta (5.0.0-beta.30)
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: e2fa60e
- commit_revisor: none
- arquivos_alterados:
  - docs/AUTH-NEXTAUTH-BETA.md
- descricao_correcao: doc com checklist de bump e política de ownership. CODEOWNERS já cobria auth paths
- observacoes: rollback para 4.x ou espera de GA é decisão humana não automatizável
- nota_revisor: doc presente e completo; verificado que os 4 paths de CODEOWNERS citados (packages/business/auth, apps/web/src/lib/auth.config.ts, apps/web/src/lib/auth.ts, apps/web/src/app/(auth)) existem na CODEOWNERS; parcialidade justificada

### ACH-003
- titulo: Sem pnpm audit no CI
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 6ad7611
- commit_revisor: none
- arquivos_alterados:
  - .github/workflows/ci.yml
- descricao_correcao: job security-audit com pnpm audit --audit-level high --prod
- observacoes: depende de ACH-001/010/011 já terem sido aplicados
- nota_revisor: job security-audit em ci.yml L101-114 executa `pnpm audit --audit-level high --prod` exatamente como a recomendação original; ordem correta (roda após overrides de CVEs aplicados)

### ACH-004
- titulo: Imagens Docker sem digest pinning
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: ae1243a
- commit_revisor: none
- arquivos_alterados:
  - docker-compose.prod.yml
  - deploy/Dockerfile.web
  - deploy/Dockerfile.worker
- descricao_correcao: postgres, redis, nginx, certbot, prometheus, alertmanager, grafana e node pinados por @sha256 (digests capturados via docker buildx imagetools inspect em 2026-04-23)
- observacoes: Dependabot docker-ecosystem (ACH-006) mantém atualizado
- nota_revisor: 7/7 imagens do compose + 4/4 FROMs dos Dockerfiles com digest sha256; Dependabot docker-ecosystem (ACH-006) manterá os bumps

### ACH-005
- titulo: Sem SBOM / attestations de build
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: d06994e
- commit_revisor: none
- arquivos_alterados:
  - .github/workflows/docker-images.yml
- descricao_correcao: cosign keyless (OIDC) via sigstore/cosign-installer + cosign sign; SLSA build provenance via actions/attest-build-provenance@v2; SBOM attestation via actions/attest-sbom@v1. SBOM CycloneDX já era gerado (anchore/sbom-action@v0)
- observacoes: requer OIDC habilitado no repo (GitHub default está on); em staging/prod o artifact fica no GHCR com o digest
- nota_revisor: todos os elementos pedidos pela recomendação (SBOM + cosign + attestations SLSA) estão implementados; permissões id-token/attestations write configuradas; anchore/sbom-action@v0 confirmado L102; encadeamento por digest correto

### ACH-006
- titulo: Dependabot sem docker-ecosystem
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: be3dfb1
- commit_revisor: none
- arquivos_alterados:
  - .github/dependabot.yml
- descricao_correcao: ecossistemas docker (/deploy), docker-compose (/), github-actions (/); grupo major-updates separado em npm; reviewers @WeaveCode-UK/owners
- observacoes: none
- nota_revisor: 4 ecossistemas (npm, docker, docker-compose, github-actions); grupo major-updates separado em npm (objetivo central do achado); schedule weekly (achado pediu 2x/semana — weekly é aceitável e o padrão recomendado do Dependabot); docker-compose é ecosystem oficialmente suportado desde 2024; compose files existem no path coberto

### ACH-007
- titulo: Sem política de licenças
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: c19be02
- commit_revisor: none
- arquivos_alterados:
  - docs/LICENSING.md
  - package.json (script license:check + devDep)
  - pnpm-lock.yaml
  - .github/workflows/ci.yml (job license-scan)
- descricao_correcao: allowlist MIT/Apache/BSD/ISC/0BSD/Unlicense/CC0/Python-2.0/BlueOak/WTFPL/MIT-0/CC-BY-4.0; denylist GPL/AGPL/LGPL/SSPL/BUSL/NC/SA/EUPL; job CI bloqueante
- observacoes: none
- nota_revisor: docs/LICENSING.md presente; script license:check usa license-checker-rseidelsohn com allowlist literal correto; devDep registrada; job license-scan em ci.yml L120-132 é bloqueante (roda pnpm license:check)

### ACH-008
- titulo: Overrides sem matriz de compatibilidade
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 115b156
- commit_revisor: none
- arquivos_alterados:
  - docs/OVERRIDES.md
- descricao_correcao: rationale por override (react, react-dom, react-native, @types/react, ioredis, protobufjs, picomatch, vite), condição de remoção e data de adição. Boas práticas
- observacoes: none
- nota_revisor: cobertura 8/8 dos overrides ativos em package.json; cada entrada tem rationale, quando remover e data de adição; seção de boas práticas cita ACH-016 (strict-peer) corretamente

### ACH-009
- titulo: Ausência de verificação de integridade de lockfile
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 4d3fbf9
- commit_revisor: none
- arquivos_alterados:
  - docs/integrity/lockfile.sha256
  - docs/integrity/README.md
  - .github/workflows/ci.yml (job lockfile-integrity)
- descricao_correcao: sha256 do pnpm-lock.yaml committado; job compara em PR; README documenta update flow
- observacoes: none
- nota_revisor: verificado que o hash committado (a698ba34...603a) bate exatamente com o sha256 do pnpm-lock.yaml atual; ordem dos commits posiciona ACH-009 após ACH-007 (última modificação do lockfile), garantindo que o job CI não falhará no branch; doc README explica bem o workflow de update

### ACH-010
- titulo: picomatch vulnerável em tooling
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 76f5194
- commit_revisor: none
- arquivos_alterados:
  - package.json
  - pnpm-lock.yaml
- descricao_correcao: override "picomatch": ">=4.0.3"; lockfile sem 2.x/3.x vulneráveis
- observacoes: none
- nota_revisor: override presente em package.json L38 e lockfile L14; única versão resolvida é picomatch@4.0.4; consumidores (fdir, tailwindcss, vite, expo) todos ≥ 4

### ACH-011
- titulo: Vite 8.0.x path traversal em sourcemaps
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: f890f95
- commit_revisor: none
- arquivos_alterados:
  - package.json
  - pnpm-lock.yaml
- descricao_correcao: override "vite": "^8.0.10"; lockfile regenerado (vite@8.0.10). @vitejs/plugin-react 6.0.2 não existe no registry, por isso o fix foi direto na dependência transitiva via override
- observacoes: divergência do texto da recomendação original (6.0.2 → override vite)
- nota_revisor: override vite ^8.0.10 em package.json L39; única versão resolvida é 8.0.10 (acima de 8.0.4 vulnerável); plugin-react 6.0.1 usa vite 8.0.10 via peer; divergência do texto original (targetar plugin-react 6.0.2 inexistente) está justificada e documentada — o objetivo (mitigar CVE vite) foi atingido

### ACH-012
- titulo: next-intl open redirect
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 10e4e07
- commit_revisor: none
- arquivos_alterados:
  - docs/migrations/next-intl-v4.md
- descricao_correcao: doc com checklist de migração 3→4 e contexto. Migração de API é breaking e exige validação humana
- observacoes: projeto não usa createMiddleware de locale-redirect — CVE não está ativa, mas o caminho fica documentado
- nota_revisor: doc presente, checklist coerente; verificado que createMiddleware realmente não é usado (grep vazio em apps/web/src); i18n/request.ts existe conforme doc; parcialidade bem justificada (refatoração de API precisa de humano)

### ACH-013
- titulo: Deprecated packages (stubs)
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7bf6c9e
- commit_revisor: none
- arquivos_alterados:
  - package.json
  - apps/api/package.json
  - apps/web/package.json
  - apps/worker/package.json
  - packages/db/package.json
  - pnpm-lock.yaml
- descricao_correcao: removidos @types/bcryptjs (4 locais) e @types/ioredis (1 local) redundantes
- observacoes: outras deprecated (glob@7, rimraf@3, uuid@3, inflight) são transitivas — Dependabot (ACH-006) cobre
- nota_revisor: grep final em todos os package.json do monorepo retornou zero ocorrências de @types/bcryptjs ou @types/ioredis; bcryptjs@3 e ioredis@5 publicam tipos próprios; correção completa

### ACH-014
- titulo: .nvmrc e Dockerfile usam tag 20 (floating)
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: b1bae9e
- commit_revisor: none
- arquivos_alterados:
  - .nvmrc
  - .github/workflows/ci.yml (node-version nos jobs fixos)
- descricao_correcao: .nvmrc=20.18.1; jobs lint-and-typecheck e arch-check usam 20.18.1. Job test mantém matrix [20, 22] (intencional). Dockerfiles já foram pinados no commit de ACH-004
- observacoes: none
- nota_revisor: .nvmrc=20.18.1 confirmado; 6 jobs em ci.yml usam 20.18.1 fixo (inclui jobs adicionados pelos ACHs posteriores); matrix [20,22] do test mantida intencionalmente para cross-major; Dockerfiles pinados em ACH-004

### ACH-015
- titulo: prepare husky roda em pnpm install
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 64533b3
- commit_revisor: none
- arquivos_alterados:
  - docs/SECURITY-HUSKY.md
  - .github/CODEOWNERS
- descricao_correcao: doc com checklist de review e endurecimento opcional; CODEOWNERS agora cobre /.husky/
- observacoes: none
- nota_revisor: CODEOWNERS L44 tem /.husky/ @WeaveCode-UK/owners; doc explica vetor e cobre checklist de review, branch protection e opções de endurecimento

### ACH-016
- titulo: Ausência de transparência/matriz de peer-dependencies
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 52071f3
- commit_revisor: none
- arquivos_alterados:
  - .github/workflows/ci.yml
- descricao_correcao: job peer-deps-report com pnpm install --strict-peer-dependencies; continue-on-error: true; artifact retention 14d
- observacoes: none
- nota_revisor: job peer-deps-report em ci.yml L138 com continue-on-error: true; roda pnpm install --strict-peer-dependencies e captura em peer-deps-report.txt; artifact retention 14d; exatamente como a recomendação pedia
