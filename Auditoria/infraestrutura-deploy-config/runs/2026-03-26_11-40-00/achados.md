# Achados da Auditoria

## Identificação
- dominio: infraestrutura-deploy-config
- run_id: 2026-03-26_11-40-00
- ultima_atualizacao: 2026-03-26 11:40:00

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve pertencer a uma categoria compatível com o domínio atual.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese e explicar a limitação.

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
- titulo: Sem CI/CD pipeline (sem GitHub Actions ou equivalente)
- severidade: critico
- categoria: automacao de deploy
- status: confirmado
- resumo: Nao existe pipeline de CI/CD configurado. Sem .github/workflows/ ou qualquer configuracao de integracao continua no repositorio.

#### Evidencia
- arquivo_ou_area: Sem .github/workflows/ no repositorio; sem configuracao de CI em nenhum lugar
- detalhe: Busca por .github/workflows, .gitlab-ci.yml, Jenkinsfile, bitbucket-pipelines.yml nao retorna resultados. Nenhuma automacao de build, test ou deploy existe.

#### Impacto
- tecnico: Testes, lint, type-check e build nao sao executados automaticamente; merges sem validacao
- negocio: Risco de deploy de codigo quebrado; sem quality gates automaticos; processo manual propenso a erros

#### Recomendacao
- acao_sugerida: Criar workflow GitHub Actions com steps de lint, type-check, test, build para PRs e pushes na main. Adicionar deploy automatizado para staging.
- prioridade: critica

#### Observacoes
- Turborepo pipeline existe e poderia ser orquestrado por GitHub Actions

---

### ACH-002
- titulo: Sem Dockerfiles para servicos de aplicacao
- severidade: critico
- categoria: containerizacao
- status: confirmado
- resumo: docker-compose.yml define apenas postgres e redis como dependencias de desenvolvimento. Nenhum Dockerfile existe para os servicos de aplicacao (API, Worker, Web, Landing).

#### Evidencia
- arquivo_ou_area: docker-compose.yml (apenas postgres e redis), raiz do repositorio (sem Dockerfile, sem apps/*/Dockerfile)
- detalhe: Busca por Dockerfile em todo o repositorio nao retorna resultados. Os 5 apps (api, web, mobile, landing, worker) nao possuem artefato de containerizacao.

#### Impacto
- tecnico: Impossivel fazer deploy containerizado; sem reproducibilidade de ambiente; diferenca entre dev e producao nao controlada
- negocio: Impossivel ir para producao com deploy controlado e reproducivel

#### Recomendacao
- acao_sugerida: Criar Dockerfiles multi-stage para api, web, worker e landing. Usar turbo prune para builds otimizados no monorepo.
- prioridade: critica

#### Observacoes
- Mobile (Expo) nao precisa de Dockerfile mas precisa de EAS Build ou equivalente

---

### ACH-003
- titulo: Sem gestao de secrets: AUTH_SECRET hardcoded no .env
- severidade: alto
- categoria: gestao de secrets
- status: confirmado
- resumo: Arquivo .env contem AUTH_SECRET com valor legivel em plaintext. Sem vault ou secret manager configurado para producao.

#### Evidencia
- arquivo_ou_area: .env (AUTH_SECRET="wbc-dev-secret-change-in-production-2026" em plaintext)
- detalhe: Secret exposto no ambiente local sem rotacao. Nenhuma integracao com vault, AWS Secrets Manager, Azure Key Vault ou similar.

#### Impacto
- tecnico: Secret exposto no ambiente local; sem mecanismo de rotacao; sem separacao de secrets por ambiente
- negocio: Risco de seguranca se .env for commitado ou vazado; nao atende requisitos de compliance

#### Recomendacao
- acao_sugerida: Integrar com secret manager (AWS Secrets Manager, Vault, ou GitHub Secrets para CI). Garantir que .env nao e commitado e que secrets de producao sao gerenciados externamente.
- prioridade: alta

#### Observacoes
- .env esta no .gitignore, reduzindo risco de commit acidental

---

### ACH-004
- titulo: Sem infraestrutura como codigo (IaC)
- severidade: alto
- categoria: infraestrutura
- status: confirmado
- resumo: Nao existe Terraform, CDK, Pulumi, Kubernetes manifests ou qualquer forma de IaC no repositorio.

#### Evidencia
- arquivo_ou_area: Sem terraform/, cdk/, pulumi/, k8s/, helm/ ou equivalente no repositorio
- detalhe: Busca por *.tf, *.tfvars, cdk.json, Pulumi.yaml, *.yaml com kind: Deployment nao retorna resultados.

#### Impacto
- tecnico: Infraestrutura de producao nao e reproducivel nem versionada; provisioning manual
- negocio: Disaster recovery lento; impossivel recriar ambiente rapidamente; vendor lock-in silencioso

#### Recomendacao
- acao_sugerida: Definir stack de IaC (Terraform ou CDK recomendados) e codificar infraestrutura necessaria (banco, cache, compute, networking)
- prioridade: alta

#### Observacoes
- Pode ser adiado se deploy inicial for em PaaS gerenciado (Vercel, Railway, Fly.io)

---

### ACH-005
- titulo: Sem CORS e CSP headers configurados
- severidade: alto
- categoria: seguranca de rede
- status: confirmado
- resumo: Nenhuma configuracao explicita de CORS ou Content-Security-Policy nos aplicativos web ou API.

#### Evidencia
- arquivo_ou_area: apps/api/src/ (sem middleware CORS), apps/web/next.config.ts (sem headers CSP), apps/landing/next.config.ts (sem headers CSP)
- detalhe: Nenhum middleware de CORS encontrado na API. Nenhuma configuracao de Content-Security-Policy nos apps Next.js.

#### Impacto
- tecnico: Vulneravel a cross-origin attacks; sem protecao contra XSS via CSP; API pode ser acessada de qualquer origem
- negocio: Risco de seguranca em producao; potencial vazamento de dados via requisicoes cross-origin maliciosas

#### Recomendacao
- acao_sugerida: Configurar CORS na API com allowlist de origens. Adicionar CSP headers nos apps Next.js via next.config headers().
- prioridade: alta

#### Observacoes
- none

---

### ACH-006
- titulo: Sem validacao de env vars no startup
- severidade: alto
- categoria: configuracao
- status: confirmado
- resumo: Variaveis de ambiente usam fallback silencioso ao inves de validacao explicita no startup. Apps podem subir com configuracao incompleta ou errada.

#### Evidencia
- arquivo_ou_area: apps/api/src/ e apps/worker/src/ — variaveis como REDIS_URL usam fallback silencioso (process.env.REDIS_URL ?? 'redis://localhost:6379/0')
- detalhe: Nao existe validacao Zod ou similar de variaveis obrigatorias no startup. Fallbacks silenciosos mascaram configuracao ausente.

#### Impacto
- tecnico: Deploy pode subir com configuracao errada sem falhar explicitamente; bugs silenciosos por fallback incorreto
- negocio: Risco de conectar em banco/cache errado em producao; dificil diagnosticar problemas de configuracao

#### Recomendacao
- acao_sugerida: Criar schema Zod para todas as env vars obrigatorias e validar no startup de cada app, falhando fast se alguma estiver ausente
- prioridade: alta

#### Observacoes
- @t3-oss/env-nextjs e uma alternativa popular para Next.js apps

---

### ACH-007
- titulo: Sem dependency vulnerability scanning
- severidade: medio
- categoria: seguranca de dependencias
- status: confirmado
- resumo: Nao existe Dependabot, Snyk, npm audit automatizado ou workflow de seguranca de dependencias configurado.

#### Evidencia
- arquivo_ou_area: Sem .github/dependabot.yml, sem .snyk, sem workflow de seguranca em .github/workflows/ (que tambem nao existe)
- detalhe: Vulnerabilidades em dependencias nao sao detectadas nem reportadas automaticamente.

#### Impacto
- tecnico: Vulnerabilidades conhecidas em dependencias nao detectadas; risco acumulativo ao longo do tempo
- negocio: Risco de seguranca por dependencias desatualizadas com CVEs conhecidas

#### Recomendacao
- acao_sugerida: Configurar Dependabot ou Renovate para atualizacoes automaticas de dependencias. Adicionar npm audit no CI pipeline.
- prioridade: media

#### Observacoes
- none

---

### ACH-008
- titulo: Sem HTTPS/TLS configurado
- severidade: medio
- categoria: seguranca de transporte
- status: confirmado
- resumo: AUTH_URL aponta para http://localhost:3000 sem configuracao TLS. Nenhuma configuracao de certificados SSL.

#### Evidencia
- arquivo_ou_area: .env (AUTH_URL=http://localhost:3000); sem certificados SSL ou configuracao TLS em nenhum app
- detalhe: Aceitavel para ambiente de desenvolvimento, mas obrigatorio para producao. Sem configuracao de redirect HTTP para HTTPS.

#### Impacto
- tecnico: Aceitavel para dev; obrigatorio para producao; sem configuracao de redirect HTTP para HTTPS
- negocio: Dados transmitidos sem criptografia em producao expoe informacoes sensiveis

#### Recomendacao
- acao_sugerida: Configurar TLS via reverse proxy (nginx, Cloudflare, ou PaaS nativo) e forcar redirect HTTP para HTTPS em todos os apps
- prioridade: media

#### Observacoes
- Maioria dos PaaS (Vercel, Railway, Fly.io) fornece TLS automatico

---

### ACH-009
- titulo: Sem documentacao de deploy
- severidade: baixo
- categoria: documentacao operacional
- status: confirmado
- resumo: Nenhum README de deploy, runbook ou procedimento documentado existe no repositorio.

#### Evidencia
- arquivo_ou_area: Sem docs/deploy/, sem DEPLOY.md, sem runbooks, sem procedimentos documentados
- detalhe: Deploy depende inteiramente de conhecimento do desenvolvedor original.

#### Impacto
- tecnico: Novos membros da equipe nao conseguem fazer deploy sem assistencia
- negocio: Risco operacional se desenvolvedor principal ficar indisponivel; onboarding lento

#### Recomendacao
- acao_sugerida: Criar documentacao de deploy com procedimentos passo-a-passo para cada ambiente (dev, staging, producao)
- prioridade: baixa

#### Observacoes
- Deve ser criado apos definicao da estrategia de deploy (PaaS vs containers)
