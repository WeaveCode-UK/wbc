---
kind: playbook
domain: supply-chain-dependencias
version: "1.0"
status: ativo
---

# Playbook do Domínio: supply-chain-dependencias

## Identificação

- dominio: supply-chain-dependencias
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio

Avaliar a higiene e o risco da cadeia de suprimentos de software do projeto — dependências diretas e transitivas, licenças, vulnerabilidades conhecidas, integridade de artefatos, provenance e risco de compromisso do processo de build e distribuição.

## Aplicabilidade

Este playbook se aplica a qualquer projeto que consome código externo, especialmente quando houver:

- package manifests (package.json, pyproject.toml, go.mod, Cargo.toml, pom.xml, Gemfile, composer.json, etc.)
- lockfiles
- imagens de container base
- binários externos baixados em build ou runtime
- scripts que executam código remoto (curl | bash, wget | sh)
- actions/workflows de CI que dependem de extensões de terceiros
- SDKs embutidos (analytics, pagamento, observabilidade, A/B testing)
- artefatos publicados publicamente

## Não Aplicabilidade

Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:

- o projeto não tem dependências externas (raro, mas possível em firmware isolado)
- o projeto é apenas documentação ou conteúdo estático sem pipeline de build
- dependências são 100% gerenciadas por um sistema externo fora do escopo auditado
- o artefato não é publicado nem distribuído

## Resultado Esperado

Uma run bem executada deste domínio deve produzir:

- inventário claro de dependências diretas e contagem de transitivas
- avaliação da postura de higiene de atualização
- lista de vulnerabilidades conhecidas aplicáveis com severidades
- avaliação da aderência a licenças (compatibilidade com uso pretendido)
- avaliação de integridade e origem (pinagem, hashes, signed commits, signed artifacts)
- avaliação de riscos óbvios de typosquatting, libs abandonadas, maintainers únicos
- avaliação da segurança do próprio pipeline de build
- consolidação dos principais riscos de supply chain
- recomendações práticas priorizadas

## Referencial Base do Playbook

Este playbook usa como baseline:

- princípios gerais de SBOM (Software Bill of Materials)
- categorias comuns de vulnerabilidades em dependências (CVE, GHSA)
- práticas recomendadas de supply chain security (SLSA, pinning, signing)
- riscos históricos conhecidos (event-stream, XZ, left-pad, typosquatting em npm/PyPI)
- avaliação objetiva do que é observável no repositório, sem substituir auditoria formal de fornecedor

## Escopo Padrão da Run

- manifests e lockfiles das dependências diretas e transitivas
- scanners e relatórios de vulnerabilidade existentes
- licenças detectadas e sua compatibilidade com o uso
- imagens base de container e sua origem
- integridade da cadeia (pinning, checksums, signed commits)
- postura do pipeline de build (CI/CD, actions, runners)
- artefatos publicados e sua provenance

## Regras Gerais do Domínio

- Executar somente verificações pertinentes à cadeia de suprimentos.
- Registrar achados apenas com evidência concreta (manifest, lockfile, CVE, registro público).
- Priorizar CVEs críticas e altas com patch disponível sobre achados teóricos.
- Separar claramente vulnerabilidade em dependência direta (acionável) de transitiva (contexto).
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Não executar scanners pesados no próprio ambiente durante a auditoria — reportar se scanners estão configurados e se foram executados recentemente.
- Considerar contexto: uma CVE alta numa lib usada só em dev tem prioridade diferente de uma em runtime.

## Fases Oficiais da Run

### Fase 1 — Inventário de Dependências (SBOM informal)

#### Objetivo

Catalogar todas as fontes de código externo consumidas pelo projeto.

#### Checks Obrigatórios

- identificar todos os manifests de pacote presentes (package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml, pom.xml, Gemfile, composer.json, etc.)
- identificar todos os lockfiles correspondentes (package-lock.json, yarn.lock, pnpm-lock.yaml, poetry.lock, go.sum, Cargo.lock, Gemfile.lock, composer.lock)
- identificar imagens base de container (Dockerfile FROM, docker-compose, k8s manifests)
- identificar binários baixados em build ou runtime (scripts de setup, Makefile, install.sh)
- identificar ações e workflows externos no CI (uses: em GitHub Actions, tasks externas em Jenkins, etc.)
- identificar SDKs, scripts CDN, dependências via `<script src=...>` no frontend
- contar dependências diretas vs transitivas quando o lockfile permitir

#### Evidências Esperadas

- todos os manifests e lockfiles no repositório
- Dockerfile, docker-compose, k8s manifests
- .github/workflows, .gitlab-ci.yml ou equivalente
- scripts de bootstrap/install
- HTML ou templates com referências a CDN
- arquivos de configuração de gerenciadores (npmrc, pip.conf, etc.)

#### Possíveis Achados

- ausência de lockfile (build não reprodutível)
- manifests conflitantes ou desatualizados em relação ao lockfile
- dependências adicionadas ao manifest mas não travadas
- carregamento dinâmico de código de CDN sem integridade
- binário baixado em runtime sem checksum
- imagem de container base sem tag específica (usa `latest`)
- action externa no CI sem pinagem (usa `@main` ou `@v1` flutuante)

#### Critério de Conclusão da Fase

A fase pode ser concluída quando estiver claro:

- quais linguagens/ecossistemas o projeto usa
- quantas dependências diretas existem por ecossistema
- quais artefatos externos são consumidos fora dos gerenciadores de pacote
- que áreas merecem análise de risco aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase

- impossibilidade de identificar os manifests principais
- lockfiles ausentes em ecossistemas críticos do projeto
- conflito grave entre manifests e lockfiles sem base para leitura segura

---

### Fase 2 — Vulnerabilidades Conhecidas e Higiene de Atualização

#### Objetivo

Avaliar a exposição a vulnerabilidades conhecidas e a postura de atualização das dependências.

#### Checks Obrigatórios

- identificar se há scanner de vulnerabilidade configurado (npm audit, pip-audit, snyk, dependabot, renovate, trivy, grype, etc.)
- verificar se o scanner roda automaticamente no CI
- identificar resultados atuais de scanner quando disponíveis no repositório
- avaliar idade média das dependências (quantas estão muitas versões major atrasadas)
- identificar dependências com CVEs públicas conhecidas em patches já disponíveis
- verificar se há bloqueio para merge em caso de CVE crítica
- identificar PRs automáticos de atualização (dependabot/renovate) e taxa de merge
- verificar se há exceções documentadas (lib fora de manutenção, patch manual aplicado)

#### Evidências Esperadas

- arquivos de config de scanner (.snyk, .dependabot.yml, renovate.json, trivy.yaml)
- workflows de CI que invocam scanners
- issues abertas geradas por dependabot/renovate
- SECURITY.md ou política de atualização documentada
- PRs recentes de bump de dependência

#### Possíveis Achados

- ausência total de scanner de vulnerabilidade
- scanner configurado mas sem integração com CI
- CVEs críticas/altas abertas há mais de N dias sem tratamento
- PRs de dependabot acumulados sem revisão
- dependências várias major atrás sem plano de atualização
- exceção ad-hoc sem justificativa (package ignorado)
- ausência de política de resposta a vulnerabilidade em dependência

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- existência e qualidade da capacidade de detecção
- postura de atualização (proativa, reativa ou ausente)
- exposição atual conhecida a vulnerabilidades aplicáveis
- riscos de lentidão na aplicação de patches

#### Condições de Bloqueio da Fase

- ausência de acesso a registros ou configs de scanner
- impossibilidade de avaliar histórico de atualização sem acesso ao git log

---

### Fase 3 — Licenças e Conformidade Legal

#### Objetivo

Avaliar a compatibilidade das licenças das dependências com o uso pretendido do projeto.

#### Checks Obrigatórios

- identificar licenças declaradas das dependências diretas
- identificar licenças problemáticas para uso comercial ou distribuição (GPL/AGPL em projeto proprietário, licenças não-comerciais, licenças ambíguas)
- verificar se há ferramenta de análise de licença configurada (license-checker, fossa, licensefinder)
- verificar se há lista de licenças permitidas/bloqueadas documentada
- identificar dependências sem licença declarada
- identificar licenças dual ou condicionais que exigem atenção

#### Evidências Esperadas

- arquivos de manifest com campo license
- configuração de ferramentas de license scanning
- NOTICE, LICENSES/ ou THIRD_PARTY_NOTICES
- políticas documentadas no README ou CONTRIBUTING
- relatórios gerados por scanners

#### Possíveis Achados

- dependência com licença incompatível com o modelo de negócio
- dependência sem licença declarada
- ausência de arquivo NOTICE/THIRD_PARTY_NOTICES quando exigido
- ausência de política de licenças aprovadas
- dependência com licença viral em código linkado estaticamente

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- postura de licenciamento das dependências
- riscos legais identificáveis
- presença ou ausência de processo de aprovação de licença

#### Condições de Bloqueio da Fase

- impossibilidade de resolver licenças de dependências críticas
- ausência de visão mínima sobre o modelo de negócio do projeto para avaliar compatibilidade

---

### Fase 4 — Integridade, Origem e Pinagem

#### Objetivo

Avaliar se a cadeia entre fonte, build e runtime mantém integridade verificável.

#### Checks Obrigatórios

- verificar se dependências são pinadas a versão exata (não range aberto)
- verificar se lockfiles registram hashes ou checksums de integridade
- verificar se imagens de container são referenciadas por digest (sha256:) ou tag semântica fixa
- verificar se actions de CI externas são pinadas por commit SHA quando possível
- verificar se commits são assinados (GPG/SSH signed commits)
- verificar se tags de release são assinadas
- verificar se artefatos publicados têm assinatura ou attestation (SLSA, Sigstore, in-toto)
- identificar scripts que executam código remoto sem verificação (curl | bash)

#### Evidências Esperadas

- lockfiles com hashes
- Dockerfile com FROM referenciando digest
- .github/workflows com actions pinadas por SHA
- configuração de branch protection exigindo signed commits
- arquivos .sigstore, SLSA provenance, in-toto attestation
- scripts de setup e seus padrões de download

#### Possíveis Achados

- dependências usando ranges abertos (^, ~) sem lockfile enforcement
- imagem base referenciada por tag mutável (latest, main)
- action externa pinada por tag ao invés de SHA
- commits não assinados em main/master
- release sem assinatura
- script de setup usando curl | bash
- artefato publicado sem provenance

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- qualidade da pinagem e reprodutibilidade do build
- integridade da cadeia de commit a release
- riscos de substituição maliciosa de artefato
- exposição a ataques de supply chain conhecidos

#### Condições de Bloqueio da Fase

- impossibilidade de acessar lockfiles ou manifests principais
- ausência de acesso a configuração de CI/CD relevante

---

### Fase 5 — Riscos de Dependências Específicas

#### Objetivo

Avaliar riscos qualitativos de dependências específicas além de CVEs — abandono, concentração de manutenção, typosquatting, risco de tomada de conta.

#### Checks Obrigatórios

- identificar dependências críticas e verificar atividade recente do mantenedor
- identificar dependências com maintainer único (bus factor 1)
- identificar dependências mantidas por pessoa individual vs organização
- identificar nomes suspeitos que possam ser typosquatting (lodahs vs lodash, requsets vs requests)
- identificar dependências sem releases há mais de N meses/anos (possível abandono)
- identificar dependências excessivamente obscuras (poucos downloads relativos ao uso)
- identificar substitutos mantidos oficialmente quando a lib está abandonada

#### Evidências Esperadas

- lista de dependências diretas
- metadados públicos do pacote (última release, contagem de mantenedores, downloads)
- histórico de issues e PRs no repositório upstream quando acessível
- avaliação comparativa com alternativas

#### Possíveis Achados

- dependência crítica abandonada ou em pré-abandono
- dependência com um único maintainer individual para componente crítico
- possível typosquatting detectado no nome
- dependência com versão travada há muito tempo em ponto que já recebeu atualizações de segurança
- dependência exótica quando existe padrão maduro disponível

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- dependências de maior risco qualitativo
- concentração de risco em mantenedores individuais
- presença de nomes suspeitos ou dependências duvidosas

#### Condições de Bloqueio da Fase

- ausência de acesso a metadados públicos para avaliação
- incapacidade de julgar criticidade sem contexto do projeto

---

### Fase 6 — Segurança do Pipeline de Build

#### Objetivo

Avaliar se o próprio processo de build é seguro e não pode ser comprometido para inserir código malicioso nos artefatos.

#### Checks Obrigatórios

- verificar onde o build executa (GitHub-hosted, self-hosted runners, Jenkins, etc.)
- verificar se runners self-hosted têm isolamento adequado entre jobs
- verificar quais segredos estão disponíveis para workflows e se seguem princípio de menor privilégio
- verificar se pull requests de fork podem acessar segredos
- verificar se há revisão obrigatória antes de workflows rodarem em PR
- verificar se build reproduzível é documentado (mesmo input = mesmo output)
- verificar se artefatos publicados incluem metadata de build (commit, build time, builder)
- verificar proteções de branch (protected branches, required reviews, required checks)

#### Evidências Esperadas

- configuração de CI/CD (.github/workflows, .gitlab-ci.yml, Jenkinsfile)
- configuração de branch protection e rulesets
- configuração de runners
- documentação de processo de release
- metadados embutidos em artefatos

#### Possíveis Achados

- runner self-hosted sem isolamento
- segredos disponíveis a workflows em PRs de fork
- ausência de branch protection na main/master
- build sem registro de proveniência
- workflow disparado por workflow externo sem validação
- release manual sem checagens automáticas obrigatórias
- chave de publicação de pacote acessível a mais workflows do que necessário

#### Critério de Conclusão da Fase

A fase pode ser concluída quando houver avaliação clara sobre:

- postura de segurança do pipeline
- riscos de comprometimento do processo de build
- qualidade dos controles de acesso a segredos e artefatos

#### Condições de Bloqueio da Fase

- ausência de acesso à configuração de CI/CD
- impossibilidade de avaliar runners quando são self-hosted fora do escopo do repositório

---

### Fase 7 — Consolidação de Achados

#### Objetivo

Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios

- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades (CVE crítica em runtime > CVE crítica em dev dependency > CVE alta em test framework)
- revisar status dos achados
- separar achados de supply chain de achados primariamente de segurança, infra ou código
- destacar riscos com exploração pública ativa ou histórico conhecido

#### Evidências Esperadas

- `achados.md` atualizado
- referências consistentes (CVE, GHSA, lockfile line)
- severidades coerentes com criticidade e exposição
- diferenciação entre risco teórico e vulnerabilidade ativa

#### Possíveis Achados

- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada
- CVE crítica subavaliada

#### Critério de Conclusão da Fase

Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase

- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run

---

### Fase 8 — Preparação para Finalização

#### Objetivo

Preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios

- revisar escopo executado
- revisar escopo não coberto
- preencher `relatorio-final.md`
- confirmar riscos prioritários
- confirmar recomendações prioritárias
- verificar se existem bloqueios abertos
- confirmar avaliação geral do domínio

#### Evidências Esperadas

- `relatorio-final.md` preenchido
- `acompanhamento.md` com próximo passo coerente
- `metadata.md` pronto para transição de estado

#### Possíveis Achados

- run incompleta
- recomendação insuficiente
- bloqueio em aberto
- relatório final inconsistente
- risco crítico mal resumido

#### Critério de Conclusão da Fase

A run deve estar pronta para ser marcada como `ready_for_finalize`.

#### Condições de Bloqueio da Fase

- falta de consolidação
- risco crítico sem tratamento documental mínimo
- inconsistência entre relatório e achados

## Ordem Oficial das Fases

1. Inventário de Dependências
2. Vulnerabilidades Conhecidas e Higiene de Atualização
3. Licenças e Conformidade Legal
4. Integridade, Origem e Pinagem
5. Riscos de Dependências Específicas
6. Segurança do Pipeline de Build
7. Consolidação de Achados
8. Preparação para Finalização

## Regras de Execução da Run Baseada neste Playbook

1. O Prompt 02 deve usar este playbook para inicializar:
   - objetivo da run
   - escopo da run
   - fases planejadas
   - fase atual inicial
   - próximo passo obrigatório
2. O Prompt 03 deve executar as fases deste playbook na ordem oficial.
3. Não pular fase sem justificativa explícita.
4. Se uma fase não for aplicável, registrar `nao_aplicavel` com justificativa.
5. Se houver impedimento real, mudar a run para `blocked`.
6. Se todas as fases aplicáveis forem concluídas, preparar transição para `ready_for_finalize`.

## Critérios para `ready_for_finalize`

A run só pode ser marcada como `ready_for_finalize` quando:

- todas as fases aplicáveis estiverem concluídas ou justificadamente marcadas como `nao_aplicavel`
- `achados.md` estiver consolidado
- `relatorio-final.md` estiver preenchido
- `acompanhamento.md` estiver atualizado
- não houver bloqueios abertos sem decisão registrada

## Situações Típicas de Bloqueio

- impossibilidade de identificar os manifests principais
- ausência de acesso a lockfiles, CI/CD ou configuração de build
- conflito grave entre manifests, lockfiles e comportamento observado

## Estrutura de Saída Esperada da Run

Ao final da execução deste playbook, a run deve ter:

- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook

- Este playbook audita supply chain de software como disciplina própria, distinta de segurança de aplicação.
- Quando uma vulnerabilidade em dependência for exploitable na aplicação real, pode ser citada também em `seguranca`, mas o núcleo do risco (lib externa) pertence aqui.
- Build e pipeline têm interface com `infraestrutura-deploy-config` — aqui o foco é cadeia de suprimentos, lá é operação e deployment.
- Este playbook não pretende substituir auditoria formal de fornecedor — foca no que é observável no repositório.
