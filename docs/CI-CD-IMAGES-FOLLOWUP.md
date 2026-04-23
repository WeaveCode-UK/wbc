# CI/CD Image Builds — Follow-up (ACH-001)

## Estado atual (pós-seed)

- `.github/workflows/docker-images.yml` builda `web` e `worker` via
  `docker/build-push-action`, push para GHCR com tags
  `sha-<short>`, `<semver>`, `latest`.
- Scan Trivy CRITICAL/HIGH com SARIF upload para Security tab.
- SBOM CycloneDX via Syft, artefato retido 30 dias.
- Cache de build via `type=gha` (acelera builds incrementais).

## Pendências para validação humana

1. **Secret `BUILD_DATABASE_URL`**: configurar valor real (ou placeholder
   aceito pelo `prisma generate` durante build). Pode ser URL de Postgres
   ephemeral que vive só durante CI.
2. **Cosign / Sigstore signing**: decisão de processo. Para assinar, adicionar
   step `sigstore/cosign-action` após build. Política de governance pendente.
3. **Promote tags para prod**: decidir se `main` → `latest` vai direto pra
   prod ou se requer approval manual. Hoje o deploy na VM roda `docker
compose build` local, não puxa do GHCR — quando puxar, tagear
   `prod-<semver>` em evento separado.
4. **Falhar build em CVE crítico**: mudar `exit-code: 0` → `exit-code: 1`
   quando baseline de CVEs estiver estabilizado (baseline atual provavelmente
   tem False Positives do Node/Alpine).
5. **Integrar com Dependabot**: Dependabot já cria PRs para bump de base
   image — confirmar que o workflow roda em PRs também (adicionar `pull_request`
   ao trigger se desejado).
6. **SBOM publicado**: além de artefato, considerar push do SBOM para
   `dependency-track.internal` ou outro SCA tool.

## Critério de fechamento

- (1) branch `main` gera build verde com SBOM e SARIF.
- (2) tag `v*.*.*` promove imagem com semver.
- (3) Security tab do repo mostra findings do Trivy.
- (4) `./deploy/deploy.sh` consome imagens do GHCR em prod (requer
  reescrever o script para `docker pull` + `up` ao invés de `build`).
