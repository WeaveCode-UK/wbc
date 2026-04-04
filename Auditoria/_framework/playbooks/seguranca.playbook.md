# Playbook do Domínio: seguranca

## Identificação
- dominio: seguranca
- versao_playbook: 1.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o sistema possui controles de segurança minimamente robustos para reduzir risco de exploração, exposição indevida, manipulação não autorizada, vazamento de dados e comprometimento operacional.

## Aplicabilidade
Este playbook se aplica a qualquer projeto de software executável, especialmente quando houver:
- autenticação
- autorização
- APIs
- dados sensíveis
- painéis administrativos
- integrações externas
- upload de arquivos
- webhooks
- sessões, tokens ou credenciais
- execução em ambiente de rede

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto não expõe endpoints ou interfaces acessíveis externamente
- não existir autenticação no escopo real do sistema
- não houver upload, webhook, sessão, API pública ou armazenamento sensível aplicável
- o sistema auditado for apenas uma biblioteca local sem superfície operacional direta

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- visão clara da superfície de exposição do sistema
- avaliação dos controles de autenticação, autorização e sessão
- avaliação de validação de entrada, proteção de dados e tratamento de erro
- avaliação de segredos, configurações sensíveis, webhooks, integrações e supply chain
- consolidação dos principais riscos de exploração
- recomendações práticas priorizadas

## Referencial Base do Playbook
Este playbook usa como baseline:
- verificação de controles técnicos de aplicação
- riscos web críticos atuais
- riscos específicos de API
- abordagem prática de teste de autenticação, autorização, sessão, input validation, erro e criptografia

## Escopo Padrão da Run
- superfície exposta
- autenticação
- autorização
- sessão e tokens
- validação e sanitização de entrada
- proteção de dados e erros
- segredos e configuração sensível
- webhooks e integrações
- dependências e supply chain de aplicação
- mecanismos básicos de proteção operacional

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com segurança.
- Não expandir para performance, UX, arquitetura ou observabilidade detalhada, salvo quando houver impacto direto na segurança.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar controles exploráveis ou ausentes sobre preocupações cosméticas.
- Separar claramente vulnerabilidade confirmada, fragilidade de controle e hipótese de risco.

## Fases Oficiais da Run

### Fase 1 — Superfície de Exposição e Mapeamento de Controles
#### Objetivo
Mapear a superfície exposta do sistema e localizar onde os principais controles de segurança deveriam existir.

#### Checks Obrigatórios
- identificar endpoints, rotas, handlers, actions, controllers, gateways ou entrypoints expostos
- identificar áreas administrativas, rotas privilegiadas e fluxos sensíveis
- identificar integrações externas, webhooks, callbacks e canais alternativos
- identificar onde autenticação, autorização, validação, sessão e proteção de dados deveriam acontecer
- identificar arquivos de configuração, env vars, middleware e componentes de segurança relevantes
- identificar uploads, processamento de arquivos, templates, rendering dinâmico ou qualquer superfície de entrada rica

#### Evidências Esperadas
- código de rotas e handlers
- middlewares e guards
- config de auth, headers, cookies, session, JWT ou OAuth/OIDC
- arquivos de env/example, manifests, compose, pipelines ou deploy configs
- documentação de API e webhooks
- pontos de entrada web, mobile, admin ou API pública

#### Possíveis Achados
- superfície exposta não mapeada claramente
- rota sensível sem controle visível
- canal alternativo menos protegido
- webhook ou callback sem proteção aparente
- área administrativa com boundary fraca
- controles distribuídos de forma inconsistente

#### Critério de Conclusão da Fase
A fase pode ser concluída quando estiver claro:
- quais são os principais pontos expostos do sistema
- onde os controles de segurança deveriam estar
- quais áreas exigem verificação aprofundada nas fases seguintes

#### Condições de Bloqueio da Fase
- impossibilidade de localizar a superfície de entrada do sistema
- ausência de acesso suficiente aos pontos de entrada relevantes
- inconsistência estrutural severa que impeça mapear fluxos básicos de segurança

---

### Fase 2 — Autenticação, Autorização e Sessão
#### Objetivo
Avaliar se o sistema autentica corretamente os usuários, aplica autorização de forma consistente e protege adequadamente sessões, tokens e canais equivalentes.

#### Checks Obrigatórios
- verificar mecanismos de autenticação e sua robustez aparente
- verificar separação entre autenticação e autorização
- verificar existência de controle de acesso por função, escopo, recurso ou objeto quando aplicável
- verificar se rotas privilegiadas exigem controle explícito
- verificar se há sinais de broken object level authorization ou broken function level authorization
- verificar gestão de sessão, cookies, expiração, revogação, logout e invalidação quando aplicável
- verificar uso de JWTs, API keys ou tokens equivalentes e seus controles básicos
- verificar recuperação de senha, troca de senha, MFA e fluxos alternativos quando existirem
- verificar se há brute-force protection, rate limit ou proteção mínima em pontos sensíveis quando aplicável

#### Evidências Esperadas
- middlewares, guards, policies ou decorators
- código de auth service, session handling, token issuing e token validation
- rotas administrativas e rotas de recurso
- configuração de cookies, flags de segurança e timeout
- fluxos de login, reset, invitation, magic link ou MFA
- testes de auth/authz, se existirem

#### Possíveis Achados
- autenticação fraca ou inconsistente
- autorização ausente ou parcial
- recurso acessível por ID sem checagem apropriada
- função privilegiada exposta sem proteção adequada
- sessão ou token sem controles mínimos
- logout ou revogação ineficaz
- fluxo alternativo mais fraco que o fluxo principal
- ausência de proteção básica contra abuso em rotas sensíveis

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- robustez de autenticação
- consistência de autorização
- qualidade dos controles de sessão ou token
- principais riscos de acesso indevido

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente ao fluxo de autenticação/autorização
- impossibilidade de determinar como o sistema autentica ou autoriza
- conflito grave entre implementação e configuração de segurança sem base suficiente para leitura segura

---

### Fase 3 — Validação de Entrada, Proteção de Dados e Tratamento de Erros
#### Objetivo
Avaliar se o sistema controla adequadamente entradas, reduz vetores clássicos de injeção e protege dados sensíveis em trânsito, processamento e saída.

#### Checks Obrigatórios
- verificar presença de validação estruturada de entrada
- verificar sanitização, escaping ou uso seguro de templating quando aplicável
- verificar risco de SQL injection, NoSQL injection, command injection, template injection, path traversal, SSRF, mass assignment e XSS quando aplicável
- verificar uso de queries parametrizadas, ORMs ou abstrações equivalentes de forma segura
- verificar exposição excessiva de dados em respostas, logs ou erros
- verificar tratamento de erro e vazamento de stack trace, exception details ou segredos
- verificar proteção de dados sensíveis em payloads, responses, logs, storage e configurações
- verificar uso de criptografia, hashing e transporte seguro quando aplicável
- verificar uploads e parsing de arquivos, se existirem

#### Evidências Esperadas
- schemas de validação
- DTOs, serializers, parsers e sanitizers
- consultas a banco, repositórios e builders de query
- controllers, services e handlers que recebem input externo
- templates, renderização, markdown, HTML ou conteúdo dinâmico
- logs, handlers de erro, filtros de exceção e responses
- fluxos de upload e armazenamento de arquivo

#### Possíveis Achados
- ausência de validação consistente
- trust excessivo em input externo
- risco de injection
- mass assignment ou binding perigoso
- exposição excessiva de dados
- erro detalhado demais em produção
- dado sensível exposto em logs ou respostas
- upload inseguro ou mal validado
- uso fraco ou inadequado de criptografia/segredos de transporte

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- qualidade da validação de entrada
- principais vetores de injeção ou exposição
- proteção de dados e erros
- riscos de manipulação indevida de entrada e saída

#### Condições de Bloqueio da Fase
- ausência de acesso suficiente às camadas que recebem e processam input
- impossibilidade de relacionar input externo ao processamento real
- forte inconsistência entre tipos/serialização e comportamento observável

---

### Fase 4 — Segredos, Configuração Sensível, Webhooks e Supply Chain
#### Objetivo
Avaliar se o sistema trata corretamente segredos, configurações sensíveis, integrações externas, webhooks e dependências relevantes para a postura de segurança.

#### Checks Obrigatórios
- verificar presença de segredos hardcoded ou valores sensíveis expostos no repositório
- verificar política aparente de uso de env vars, secret stores ou mecanismo equivalente
- verificar configuração de headers de segurança, CORS, CSP e defaults sensíveis quando aplicável
- verificar webhooks quanto a assinatura, validação, origem, replay, idempotência e tratamento de falhas quando aplicável
- verificar integrações externas quanto a credenciais, escopo e tratamento básico de erro
- verificar dependências críticas, pinagem, atualização aparente e riscos óbvios de supply chain
- verificar existência de artefatos inseguros de debug, defaults inseguros ou modos permissivos em produção
- verificar configuração de storage, buckets, filas e serviços externos quando afetarem diretamente segurança

#### Evidências Esperadas
- `.env.example`, configs, manifests, compose, helm, workflows, pipelines
- arquivos de webhook handling e integração externa
- package manifests, lockfiles e scanners configurados, se existirem
- middlewares e config de headers/CORS/CSP
- documentação operacional relevante
- referências a secret managers ou equivalents

#### Possíveis Achados
- segredo hardcoded
- configuração sensível exposta
- CORS permissivo sem justificativa
- headers de segurança ausentes onde fariam sentido
- webhook sem verificação de autenticidade
- replay window sem mitigação
- credencial excessiva ou mal segregada
- dependência crítica sem higiene mínima
- debug mode ou comportamento permissivo em ambiente sensível

#### Critério de Conclusão da Fase
A fase pode ser concluída quando houver avaliação clara sobre:
- postura de segredos e configuração sensível
- robustez de webhooks e integrações
- riscos óbvios de supply chain e exposição operacional

#### Condições de Bloqueio da Fase
- ausência de acesso à configuração mínima necessária
- impossibilidade de identificar como integrações ou webhooks são protegidos
- conflito grave entre configs e implementação sem base suficiente para leitura segura

---

### Fase 5 — Proteção Operacional e Preparação do Panorama de Risco
#### Objetivo
Avaliar mecanismos básicos de proteção operacional e preparar a consolidação de risco da run.

#### Checks Obrigatórios
- verificar existência de rate limiting, throttling ou proteção equivalente quando aplicável
- verificar proteção contra abuso em endpoints sensíveis
- verificar trilhas mínimas de auditoria para eventos relevantes quando aplicável
- verificar se logs evitam exposição indevida de segredos ou dados sensíveis
- verificar defaults de segurança em ambientes não locais quando inferíveis
- verificar existência de barreiras mínimas para endpoints administrativos, internos ou de manutenção
- verificar presença de indicadores de hardening mínimo do runtime quando aplicável

#### Evidências Esperadas
- middlewares de rate limit
- audit logs, event logs ou trilhas equivalentes
- proteção de rotas internas/admin
- filtros de log ou redaction
- configuração de ambientes
- mecanismos de abuse protection

#### Possíveis Achados
- endpoint sensível sem proteção operacional mínima
- ausência de rate limit onde seria esperado
- log de segredo ou dado sensível
- área administrativa insuficientemente segregada
- hardening operacional fraco
- trilha de auditoria inexistente para ações críticas

#### Critério de Conclusão da Fase
A fase pode ser concluída quando o panorama de risco operacional mínimo estiver claro o suficiente para consolidar a run.

#### Condições de Bloqueio da Fase
- falta de evidência suficiente para inferir proteções mínimas
- inconsistência grave entre runtime esperado e configurações observáveis
- impossibilidade de avaliar rotas críticas ou áreas administrativas

---

### Fase 6 — Consolidação de Achados
#### Objetivo
Consolidar os achados levantados nas fases anteriores.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades
- confirmar severidades
- revisar status dos achados
- separar achados realmente de segurança de achados cujo núcleo pertença a outro domínio
- destacar os riscos exploráveis ou de maior impacto

#### Evidências Esperadas
- `achados.md` atualizado
- referências consistentes no histórico
- severidades coerentes
- diferenciação entre fragilidade, hipótese e problema confirmado

#### Possíveis Achados
- duplicidade de achado
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco importante subavaliado

#### Critério de Conclusão da Fase
Todos os achados relevantes da run devem estar registrados de forma consistente, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run

---

### Fase 7 — Preparação para Finalização
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
1. Superfície de Exposição e Mapeamento de Controles
2. Autenticação, Autorização e Sessão
3. Validação de Entrada, Proteção de Dados e Tratamento de Erros
4. Segredos, Configuração Sensível, Webhooks e Supply Chain
5. Proteção Operacional e Preparação do Panorama de Risco
6. Consolidação de Achados
7. Preparação para Finalização

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
- ausência de estrutura mínima para verificar o domínio
- inconsistência estrutural da run
- evidência insuficiente para avançar com segurança
- conflito grave entre configuração, documentação e implementação sem base suficiente para conclusão

## Estrutura de Saída Esperada da Run
Ao final da execução deste playbook, a run deve ter:
- histórico operacional atualizado
- achados consolidados
- relatório final preenchido
- estado final em `ready_for_finalize` ou `blocked`

## Observações do Playbook
- Este playbook audita segurança de aplicação e superfície operacional próxima.
- Vulnerabilidades profundas de arquitetura, observabilidade, testes, performance ou infraestrutura devem ser tratadas também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente segurança, ele pode ser citado aqui como impacto de segurança, sem substituir a auditoria específica daquele domínio.
