# Domínios Oficiais do Framework de Auditoria

## 1. arquitetura
- Objetivo: verificar se a arquitetura declarada e a arquitetura implementada estão coerentes.
- Aplicabilidade: qualquer projeto de software.
- Cobre: módulos, camadas, boundaries, acoplamento, coesão, dependências cruzadas, padrão arquitetural real.
- Não cobre diretamente: segurança detalhada, performance detalhada, infraestrutura.

## 2. codigo-manutenibilidade
- Objetivo: verificar a saúde do código para evolução e manutenção.
- Aplicabilidade: qualquer projeto com código-fonte.
- Cobre: legibilidade, complexidade, duplicação, smells, clareza estrutural, dívida técnica visível.
- Não cobre diretamente: arquitetura macro, observabilidade, deploy.

## 3. seguranca
- Objetivo: verificar riscos de exploração, exposição indevida e falhas de proteção.
- Aplicabilidade: qualquer projeto executável, especialmente com rede, autenticação, dados ou usuários.
- Cobre: auth, authz, validação, injection, XSS, CSRF, SSRF, secrets, uploads, headers, rate limit, tokens, webhooks inseguros.
- Não cobre diretamente: performance, UX, modelagem de domínio.

## 4. apis-integracoes
- Objetivo: verificar consistência e robustez das superfícies de integração.
- Aplicabilidade: projetos com API, webhooks ou dependências externas.
- Cobre: rotas, contratos, versionamento, status codes, idempotência, paginação, retries, timeouts, integrações externas.
- Não cobre diretamente: segurança profunda de credenciais, UX de interface.

## 5. dados-persistencia
- Objetivo: verificar a qualidade estrutural e operacional da camada de dados.
- Aplicabilidade: projetos com banco, storage ou persistência relevante.
- Cobre: modelagem, schema, constraints, índices, migrations, integridade, concorrência, consistência transacional, queries.
- Não cobre diretamente: UX, observabilidade global, deploy.

## 6. performance-escalabilidade
- Objetivo: verificar eficiência e capacidade de crescimento do sistema.
- Aplicabilidade: qualquer projeto que execute carga real.
- Cobre: gargalos, N+1, payloads, cache, filas, throughput, hotspots, renderizações desnecessárias.
- Não cobre diretamente: segurança, qualidade visual da interface.

## 7. confiabilidade-resiliencia
- Objetivo: verificar comportamento do sistema sob erro, falha externa e concorrência.
- Aplicabilidade: qualquer projeto com integrações, jobs, paralelismo ou processamento assíncrono.
- Cobre: retries, backoff, timeouts, idempotência operacional, race conditions, duplicidade, recuperação.
- Não cobre diretamente: estética de UI, modelagem de código em si.

## 8. observabilidade-operacao
- Objetivo: verificar capacidade de observação, diagnóstico e operação do sistema.
- Aplicabilidade: qualquer projeto com ambiente de execução real.
- Cobre: logs, métricas, tracing, alertas, health checks, readiness, visibilidade de falhas.
- Não cobre diretamente: UX, regras de negócio, arquitetura lógica.

## 9. testes-qualidade
- Objetivo: verificar a proteção contra regressões e a robustez da validação automatizada.
- Aplicabilidade: qualquer projeto em evolução.
- Cobre: unit, integration, e2e, cobertura útil, lacunas críticas, fragilidade dos testes, gates.
- Não cobre diretamente: infraestrutura em produção, UX visual.

## 10. ui-ux-fluxos
- Objetivo: verificar integridade funcional e qualidade de experiência da interface.
- Aplicabilidade: projetos com frontend, app ou interface administrativa.
- Cobre: telas conectadas, estados, feedback visual, responsividade, acessibilidade básica, fluxos ponta a ponta.
- Não cobre diretamente: backend security profunda, modelagem de banco.

## 11. infraestrutura-deploy-config
- Objetivo: verificar readiness operacional e segurança da configuração de execução.
- Aplicabilidade: qualquer projeto que rode fora do editor local.
- Cobre: env vars, CI/CD, deploy, containers, secrets, rollback, ambientes, backups quando aplicável.
- Não cobre diretamente: UX, arquitetura de domínio, qualidade semântica do código.

## 12. compliance-privacidade
- Objetivo: verificar aderência a obrigações regulatórias de proteção de dados pessoais (LGPD, GDPR e equivalentes).
- Aplicabilidade: projetos que coletam, processam ou compartilham dados pessoais de usuários.
- Cobre: mapeamento de PII, base legal, consentimento, direitos dos titulares, retenção, transferência, resposta a incidentes.
- Não cobre diretamente: segurança técnica de aplicação (fica em `seguranca`), parecer jurídico formal.

## 13. supply-chain-dependencias
- Objetivo: verificar higiene e risco da cadeia de suprimentos de software.
- Aplicabilidade: qualquer projeto com dependências externas ou pipeline de build.
- Cobre: inventário/SBOM, CVEs conhecidas, licenças, integridade/pinning, riscos qualitativos de libs, segurança do pipeline.
- Não cobre diretamente: vulnerabilidades de aplicação (fica em `seguranca`), arquitetura interna.

## 14. custos-finops
- Objetivo: verificar eficiência financeira da operação e identificar desperdícios e oportunidades de otimização.
- Aplicabilidade: projetos que rodam em cloud ou consomem serviços pagos relevantes.
- Cobre: inventário de recursos, sizing, anti-padrões de custo, observabilidade de custo, otimização comercial.
- Não cobre diretamente: arquitetura funcional, performance em si (fica em `performance-escalabilidade` quando for o foco).

## 15. documentacao-runbooks
- Objetivo: verificar se a documentação permite continuidade operacional, onboarding e resposta a incidentes sem conhecimento tácito.
- Aplicabilidade: projetos em operação com mais de um mantenedor atual ou potencial.
- Cobre: README/onboarding, ADRs/arquitetura, runbooks operacionais, incident response, documentação de API e integrações.
- Não cobre diretamente: qualidade do código em si, correção de bugs; foca em qualidade do conhecimento documentado.
