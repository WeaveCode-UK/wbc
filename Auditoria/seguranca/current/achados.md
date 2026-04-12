# Achados da Auditoria

## Identificação
- dominio: seguranca
- run_id: 2026-04-10_14-39-37
- ultima_atualizacao: 2026-04-12 08:19:42

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese com justificativa.

## Severidades Permitidas
- critico
- alto
- medio
- baixo
- informativo

## Status Permitidos
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: Grafana de producao fica publicada com fallback `admin` e sem camada extra no proxy
- severidade: critico
- categoria: configuracao-sensivel-exposta
- status: aberto
- resumo: O deploy de producao expoe `/grafana/` via nginx e define `GF_SECURITY_ADMIN_PASSWORD` com fallback para `admin`, sem auth_basic, OIDC ou restricao por IP no proxy. Se `GRAFANA_PASSWORD` nao for fornecida corretamente, o console administrativo fica acessivel com credencial padrao.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:128
- detalhe: `GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}` aplica senha administrativa default quando a variavel nao estiver definida.
- arquivo_ou_area: deploy/nginx.conf:68
- detalhe: o bloco `location /grafana/` publica o servico Grafana sem camada adicional de autenticacao no proxy.

#### Impacto
- tecnico: um atacante pode assumir o painel Grafana, consultar dashboards, fontes de dados e metadados operacionais, e ampliar reconhecimento do ambiente.
- negocio: exposicao de observabilidade e telemetria reduz a capacidade de resposta e aumenta o risco de incidente com vazamento operacional.

#### Recomendacao
- acao_sugerida: remover o fallback `admin`, exigir segredo obrigatorio no deploy e colocar `/grafana/` atras de autenticacao forte ou allowlist de rede.
- prioridade: alta

#### Observacoes
- Este risco existe no deploy previsto mesmo sem considerar a superficie tRPC ainda desconectada do runtime do projeto.

### ACH-002
- titulo: Exportacao de dados do tenant nao respeita a permissao `tenant:export`
- severidade: alto
- categoria: autorizacao-fraca
- status: aberto
- resumo: O endpoint `platform.exportData` esta protegido apenas por `protectedProcedure`, embora a matriz de permissoes reserve `tenant:export` apenas para `ADMIN`. O repositorio retorna nome, telefone, email de clientes, alem de vendas e despesas do tenant.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/platform.ts:14
- detalhe: `exportData` usa `protectedProcedure.query(...)` sem `roleProtectedProcedure` nem `requirePermission`.
- arquivo_ou_area: packages/business/platform/adapters/prisma-platform-repository.ts:31
- detalhe: a exportacao seleciona PII e dados financeiros (`name`, `phone`, `email`, `classification`, `sales`, `expenses`) do tenant.
- arquivo_ou_area: packages/business/auth/domain/permissions.ts:9
- detalhe: a permissao `tenant:export` existe e so e atribuida a `ADMIN`.

#### Impacto
- tecnico: ha um caso classico de broken function level authorization para exportacao ampla de dados.
- negocio: membros autenticados com perfil nao administrativo podem exfiltrar base de clientes e dados financeiros do workspace.

#### Recomendacao
- acao_sugerida: exigir `roleProtectedProcedure('ADMIN')` ou `requirePermission(..., 'tenant:export')` antes de liberar `exportData`, e revisar endpoints sensiveis semelhantes.
- prioridade: alta

#### Observacoes
- O risco se materializa quando a superficie tRPC for publicada; o frontend ja aponta para `/api/trpc` e o handler esta permissivo como escrito.

### ACH-003
- titulo: Revogacao de sessoes nao governa o runtime Auth.js baseado em JWT
- severidade: medio
- categoria: sessao-e-tokens
- status: aberto
- resumo: O web usa Auth.js com `strategy: 'jwt'`, enquanto a API expõe `listSessions`, `revokeSession` e `revokeAllSessions` apoiados em `SessionRepository` e use-cases de refresh session que nao estao ligados ao login ativo. O controle de revogacao pode aparentar funcionar sem invalidar o cookie real.

#### Evidencia
- arquivo_ou_area: apps/web/src/lib/auth.config.ts:131
- detalhe: a sessao do web usa `strategy: 'jwt'` com `maxAge: 15 * 60`.
- arquivo_ou_area: apps/api/src/routers/auth.ts:220
- detalhe: a API lista e revoga sessoes pela tabela/repositorio proprio (`sessionRepo`).
- arquivo_ou_area: packages/business/auth/use-cases/create-session.use-case.ts:17
- detalhe: existe fluxo separado de refresh/session persistida que cria `refreshToken` e grava `tokenHash`.
- arquivo_ou_area: rg -n "new CreateSession|CreateSession\\(|RefreshSession|findByTokenHash\\(" apps packages -g'*.ts' -g'*.tsx'
- detalhe: a busca retornou apenas definicoes/exportacoes desses fluxos, sem instanciacao nos apps em execucao.

#### Impacto
- tecnico: um JWT comprometido continua valido ate expirar mesmo apos tentativa de revogacao via endpoints de sessao.
- negocio: resposta a incidente e logout remoto ficam menos confiaveis do que a interface promete.

#### Recomendacao
- acao_sugerida: alinhar o runtime para usar sessao persistida/refresh token real ou remover os endpoints de revogacao ate que eles invalidem a sessao efetiva.
- prioridade: media

#### Observacoes
- O maxAge de 15 minutos reduz a janela, mas nao elimina o gap entre o controle exposto e o comportamento real.

### ACH-004
- titulo: Rotas `/api/metrics` e `/api/health` ficam publicas sem autenticacao adicional
- severidade: medio
- categoria: superficie-exposta
- status: aberto
- resumo: O middleware do web libera todo o prefixo `/api`, e as rotas de metrics/health respondem sem qualquer autenticacao. Isso expoe telemetria Prometheus e o estado do banco para chamadas anonimas.

#### Evidencia
- arquivo_ou_area: apps/web/src/middleware.ts:9
- detalhe: o middleware retorna `NextResponse.next()` para qualquer rota que comece com `/api`.
- arquivo_ou_area: apps/web/src/app/api/metrics/route.ts:9
- detalhe: a rota devolve `registry.metrics()` com `collectDefaultMetrics`.
- arquivo_ou_area: apps/web/src/app/api/health/route.ts:7
- detalhe: a rota executa `SELECT 1`, retorna `status`, `apiVersion`, `checks` e `timestamp` sem controle de acesso.

#### Impacto
- tecnico: um atacante externo consegue coletar sinais de disponibilidade, telemetria de processo e metadados uteis para reconhecimento.
- negocio: a superficie publica de diagnostico facilita scraping, enumeracao e planejamento de abuso contra o ambiente.

#### Recomendacao
- acao_sugerida: restringir essas rotas a rede interna, token de monitoramento ou proxy autenticado; separar liveness publica de diagnostico detalhado.
- prioridade: media

#### Observacoes
- O nginx atual encaminha o trafego para o web sem filtro adicional, portanto essas rotas ficam atingiveis no deploy padrao.

### ACH-005
- titulo: CSP de producao permite `unsafe-inline` em `script-src`
- severidade: medio
- categoria: headers-e-hardening
- status: aberto
- resumo: A politica de seguranca de conteudo enviada em producao mantem `script-src 'self' 'unsafe-inline'`, o que reduz materialmente a utilidade da CSP como barreira adicional contra XSS.

#### Evidencia
- arquivo_ou_area: apps/web/next.config.mjs:7
- detalhe: em producao `scriptSrc` e definido como `"'self' 'unsafe-inline'"`.
- arquivo_ou_area: apps/web/next.config.mjs:18
- detalhe: o header `Content-Security-Policy` reutiliza esse valor diretamente em `script-src`.

#### Impacto
- tecnico: qualquer injecao que chegue como script inline deixa de ser barrada pela CSP.
- negocio: futuros bugs de renderizacao ou sanitizacao passam a ter maior chance de virar execucao arbitraria no browser.

#### Recomendacao
- acao_sugerida: migrar para CSP com nonce/hash compativel com Next.js e revisar `connect-src` para apenas os destinos realmente necessarios.
- prioridade: media

#### Observacoes
- Os demais headers base (HSTS, frame-ancestors, nosniff) ajudam, mas nao compensam a liberacao de script inline.

### ACH-006
- titulo: Supply chain com vulnerabilidades altas e moderadas abertas no lock atual
- severidade: alto
- categoria: supply-chain
- status: aberto
- resumo: A execucao de `pnpm audit --prod --json` identificou 9 vulnerabilidades altas e 7 moderadas nas dependencias de producao. O stack web/landing permanece em `next@15.5.14` e `next-intl@3.26.5`, e o stack mobile/Expo carrega advisories altos em `node-forge` e `@xmldom/xmldom`.

#### Evidencia
- arquivo_ou_area: pnpm audit --prod --json
- detalhe: o audit reportou `next@15.5.14` com advisory alta GHSA-q4gf-8mx6-v5v3, `next-intl@3.26.5` com advisory moderada GHSA-8f24-v5vv-gm5j, `node-forge <1.4.0` alta via cadeia Expo e `@xmldom/xmldom 0.8.11` alta via Expo.
- arquivo_ou_area: apps/web/package.json:29
- detalhe: o workspace web depende de `next: ^15.0.0`.
- arquivo_ou_area: apps/web/package.json:31
- detalhe: o workspace web depende de `next-intl: ^3.20.0`.
- arquivo_ou_area: apps/mobile/package.json:18
- detalhe: o mobile depende de `expo: ~54.0.33`, cadeia onde o audit encontrou advisories altos.
- arquivo_ou_area: apps/landing/package.json:14
- detalhe: o landing tambem depende de `next: ^15.0.0`.

#### Impacto
- tecnico: o lock atual mantem bibliotecas com advisories relevantes de DoS, open redirect e problemas altos transitivos.
- negocio: aumenta a urgencia de patching em web, landing e mobile, com risco tanto de indisponibilidade quanto de abuso de navegacao.

#### Recomendacao
- acao_sugerida: priorizar upgrade de `next` para 15.5.15+ e de `next-intl` para versao corrigida; depois atacar a cadeia Expo conforme sugerido pelo audit e adicionar scanner recorrente em CI.
- prioridade: alta

#### Observacoes
- O resultado e temporalmente sensivel e foi coletado em 2026-04-12 com acesso ao registry.
