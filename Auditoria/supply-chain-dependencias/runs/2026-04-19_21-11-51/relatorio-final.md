# Relatório Final da Auditoria

## Identificação
- dominio: supply-chain-dependencias
- run_id: 2026-04-19_21-11-51
- status_run: ready_for_finalize
- iniciado_em: 2026-04-19 21:11:51
- finalizado_em: none
- ultima_atualizacao: 2026-04-19 21:25:00

## Objetivo da Run
Avaliar higiene da cadeia de dependências (NPM + Docker) do WBC, maturidade do pipeline de atualização/vulnerabilidade e transparência (SBOM/assinatura).

## Escopo Executado
- pnpm workspace (root + apps/* + packages/*); `pnpm-lock.yaml`
- Dependabot config, CI (`ci.yml`)
- Dockerfiles e docker-compose.prod.yml (base images, digests)
- Overrides de pnpm; deprecated packages; CVEs conhecidas

## Escopo Nao Coberto ou Parcial
- Execução empírica de `pnpm audit` (listado como ACH; resultados sumarizados a partir do agent Explore)
- Assinatura real de commits
- GitHub security alerts do console (só é verificável no GitHub)

## Resumo Executivo
A cadeia de dependências do WBC está em estado preocupante. Há 1 CVE crítica em `protobufjs` vindo via `@opentelemetry/auto-instrumentations-node`, `next-auth` está em pre-release em produção (auth!), e não há qualquer scanner de vulnerabilidades no CI. Imagens Docker carregam tags mutáveis sem digest pinning; Dependabot cobre apenas NPM em `/`. Sem SBOM, sem política de licenças, sem assinatura de imagens. Overrides major (React 19, RN 0.81) não têm matriz de compatibilidade documentada. Há também CVEs médias em `next-intl`, Vite e picomatch; pacotes deprecated acumulam. Avaliação geral: `preocupante`.

## Principais Achados
1. ACH-001 (critico) protobufjs < 7.5.5 via OpenTelemetry — RCE
2. ACH-002 (alto) next-auth em beta em produção
3. ACH-003 (alto) sem audit/vulnerability scanning no CI
4. ACH-004 (alto) imagens Docker sem digest pinning
5. ACH-005 (alto) sem SBOM nem assinatura/attestation
6. ACH-006 (alto) Dependabot limitado (sem docker e sem major channel)

## Distribuicao por Severidade
- critico: 1
- alto: 5
- medio: 6
- baixo: 4
- informativo: 0

## Riscos Prioritarios
1. Exploração de RCE via protobufjs em pipeline de telemetria (ACH-001) — corrige-se rápido, mas hoje é porta aberta.
2. Auth em beta (ACH-002) = risco em fluxos críticos; breaking changes silenciosos.
3. CI sem audit (ACH-003) = qualquer PR introduz CVE sem alarme.
4. Imagens "floating" (ACH-004) + sem SBOM (ACH-005) = supply-chain difícil de auditar.
5. Dependabot limitado (ACH-006) = upgrades manuais.

## Recomendacoes Prioritarias
1. Aplicar override `protobufjs ≥ 7.5.5` imediatamente ou atualizar `@opentelemetry/auto-instrumentations-node` (ACH-001).
2. Aguardar GA de `next-auth@5` (ou rollback para `4.x`) e planejar migração (ACH-002).
3. Adicionar `pnpm audit --audit-level high` no CI como gate bloqueante; considerar Snyk/Grype/Trivy filesystem em matrizes (ACH-003).
4. Pinar imagens Docker por digest `@sha256:...`; Dependabot docker-ecosystem para manter (ACH-004, ACH-006).
5. Emitir SBOM CycloneDX (Syft) em cada build; assinar imagens com cosign; attestations SLSA (ACH-005).
6. Política de licenças + `license-checker` no CI (ACH-007).
7. `pnpm.overrides` documentados em `docs/OVERRIDES.md` com rationale; CI com `--strict-peer-dependencies` opcional (ACH-008, ACH-016).
8. Pinar Node minor (`20.13.0`) em `.nvmrc` e Dockerfile (ACH-014).
9. Limpar deprecated; `pnpm dedupe` regular (ACH-013).
10. Atualizar `next-intl` para ≥4.9.1, Vite para ≥8.0.5, tooling picomatch (ACH-010, ACH-011, ACH-012).

## Avaliacao Geral do Dominio
- avaliacao: preocupante

Justificativa: a maioria das lacunas é endereçável com alterações de config e integração de ferramentas já padrão da indústria; manter o estado atual implica risco real, como a CVE crítica não mitigada.

## Prontidao para Encerramento
- pronto_para_finalizar: sim
- justificativa: 7 fases concluídas; 16 achados; sem bloqueios.

## Observacoes Finais
- Cross-ref: infra/ACH-006 (tags `:latest`), seguranca/ACH-015 (secret scanning), testes-qualidade/ACH-007 (arch:check no CI), observabilidade/ACH-007 (SLO/alertas).
