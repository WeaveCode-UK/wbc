---
kind: playbook
domain: seguranca
version: "2.0"
status: ativo
---

# Playbook do Domínio: seguranca

## Identificação
- dominio: seguranca
- versao_playbook: 2.0
- status: ativo
- ultima_atualizacao: none

## Objetivo do Domínio
Avaliar se o sistema possui controles de segurança robustos para reduzir risco de exploração, exposição indevida, manipulação não autorizada, vazamento de dados, abuso de fluxo, comprometimento de identidade, vazamento entre tenants e degradação operacional. Cobre desde mapeamento proativo de superfície até detecção e resposta a incidente.

## Aplicabilidade
Este playbook se aplica a qualquer projeto de software executável, especialmente quando houver:
- autenticação e autorização
- sessões, tokens, cookies ou credenciais
- APIs públicas, privadas ou internas
- dados sensíveis, pessoais, financeiros ou regulados
- painéis administrativos
- multi-tenancy explícito ou implícito
- integrações externas, webhooks ou callbacks
- upload, parsing ou processamento de arquivos
- componentes baseados em LLM ou agentes de IA
- execução em ambiente de rede pública
- frontend executando código em navegador do usuário
- domínios, e-mail e DNS de marca

## Não Aplicabilidade
Partes deste playbook podem ser marcadas como `nao_aplicavel` quando:
- o projeto não expõe endpoints ou interfaces acessíveis externamente
- não existir autenticação no escopo real do sistema
- não houver upload, webhook, sessão, API pública, multi-tenancy ou armazenamento sensível aplicável
- o sistema não tiver frontend em navegador
- o sistema não tiver domínio/e-mail próprio sob auditoria
- o sistema não usar LLMs ou agentes
- o sistema auditado for apenas uma biblioteca local sem superfície operacional direta

## Resultado Esperado
Uma run bem executada deste domínio deve produzir:
- modelo de ameaça resumido e mapa da superfície de exposição
- avaliação de autenticação, sessão, autorização, IAM e isolamento multi-tenant
- avaliação de validação, injeção clássica, vetores modernos e abuse de lógica
- avaliação de criptografia, transporte seguro e proteção de dados em I/O
- avaliação de hardening de browser, headers e cookies
- avaliação de segredos, configuração sensível, webhooks, e-mail e DNS
- avaliação da esteira de segurança no CI, detecção, audit log e resposta a incidente
- avaliação de proteção contra abuso (rate limit, WAF, bot/CAPTCHA)
- consolidação dos principais riscos exploráveis
- recomendações práticas priorizadas

## Referencial Base do Playbook
Este playbook usa como baseline:
- riscos web críticos atuais (OWASP Top 10 Web e API)
- riscos modernos de aplicação com componentes de IA (OWASP Top 10 LLM)
- abordagem prática de threat modeling (STRIDE)
- princípios de Zero Trust e menor privilégio
- ciclo de vida de segredos e identidades
- postura defensiva: detecção, resposta e contenção

## Escopo Padrão da Run
- modelo de ameaça e superfície exposta
- autenticação
- sessão, tokens e cookies
- autorização e controle de acesso
- isolamento multi-tenant
- IAM administrativo
- validação e sanitização de entrada
- injeção clássica
- vetores modernos de injeção
- lógica de negócio e abuse de fluxo
- criptografia e transporte seguro
- proteção de dados em I/O
- headers de segurança e browser hardening
- segredos, lifecycle e configuração sensível
- webhooks e integrações externas
- e-mail, domínio e DNS
- esteira CI de segurança (SAST/DAST/secret scanning)
- detecção, audit log e resposta a incidente
- bot/abuse protection e hardening operacional

## Regras Gerais do Domínio
- Executar somente verificações compatíveis com segurança.
- Não expandir para performance, UX, arquitetura ou observabilidade detalhada, salvo quando houver impacto direto na segurança.
- Registrar achados apenas com evidência suficiente.
- Marcar itens como `nao_aplicavel` somente com justificativa objetiva.
- Priorizar controles exploráveis ou ausentes sobre preocupações cosméticas.
- Separar claramente vulnerabilidade confirmada, fragilidade de controle e hipótese de risco.
- Quando um vetor cruzar fases (ex: brute force em login vs rate limit geral), registrar na fase mais específica e referenciar nas demais sem duplicar.
- Quando o núcleo do problema pertencer a outro domínio (dados-persistencia, infraestrutura-deploy-config, supply-chain-dependencias, compliance-privacidade, observabilidade-operacao, confiabilidade-resiliencia), citar como impacto de segurança e remeter ao domínio próprio.

## Fases Oficiais da Run

### Fase 1 — Threat Modeling e Mapeamento de Superfície
#### Objetivo
Construir um modelo de ameaça mínimo do sistema e mapear toda a superfície exposta antes de auditar controles individuais.

#### Checks Obrigatórios
- aplicar STRIDE de forma resumida sobre os componentes principais (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- identificar todos os entrypoints: rotas, handlers, actions, controllers, gateways, jobs disparados externamente, webhooks, callbacks, canais alternativos
- identificar áreas administrativas, rotas privilegiadas e fluxos sensíveis (pagamento, exportação, reset, convite)
- identificar trust boundaries (frontend ↔ backend, API pública ↔ interna, tenant ↔ tenant, humano ↔ máquina)
- identificar onde autenticação, autorização, validação, sessão e proteção de dados deveriam acontecer no fluxo (mapa de controles esperados, antes da auditoria de cada controle)
- identificar arquivos de configuração, env vars, middlewares, guards, policies e componentes de segurança relevantes para serem auditados nas fases seguintes
- identificar superfícies de entrada rica: uploads, processamento de arquivos, templates, rendering dinâmico, conteúdo HTML/Markdown gerado pelo usuário, parsers complexos
- produzir inventário de campos de entrada por endpoint relevante (tipo, origem, validação observada)

#### Evidências Esperadas
- código de rotas, handlers e middlewares
- documentação de API (OpenAPI, GraphQL schema, gRPC proto)
- diagramas de arquitetura quando existirem
- env vars e configs que descrevam endpoints
- código de jobs, workers e listeners

#### Possíveis Achados
- superfície exposta não documentada ou inconsistente
- entrypoint sensível esquecido (job, callback, fila)
- trust boundary mal definida
- canal alternativo menos protegido
- ausência de inventário mínimo de entrada

#### Critério de Conclusão da Fase
Quando o modelo de ameaça resumido e o mapa da superfície estiverem claros o suficiente para guiar as fases seguintes.

#### Condições de Bloqueio da Fase
- impossibilidade de localizar a superfície de entrada
- ausência de acesso a partes relevantes do código
- inconsistência estrutural severa que impeça mapear fluxos básicos

---

### Fase 2 — Autenticação
#### Objetivo
Avaliar como o sistema confirma a identidade de usuários e máquinas em todos os fluxos de entrada.

#### Checks Obrigatórios
- verificar mecanismo de login principal e robustez aparente
- verificar política de senha (comprimento, hashing com KDF apropriado, proibição de senhas vazadas)
- verificar suporte e cobertura de MFA (obrigatório para admins, opcional para usuários)
- verificar fluxos alternativos: magic link, OAuth/OIDC, SSO, invite, social login
- verificar fluxos de recuperação e troca de senha (incluindo half-open attacks)
- verificar OTP/códigos de verificação (entropia, expiração, rate limit)
- verificar brute force protection no login (lockout, exponential backoff, CAPTCHA progressivo)
- verificar credential stuffing protection (have-i-been-pwned, device fingerprint)

#### Evidências Esperadas
- código de auth service e password hashing
- middlewares de login
- fluxos de reset, invitation, magic link, MFA
- configuração de provedor de identidade (Auth0, Cognito, Supabase, Clerk, custom)
- testes de auth, se existirem

#### Possíveis Achados
- hashing fraco ou ausente
- ausência de MFA em acessos sensíveis
- fluxo de recuperação mais fraco que login
- ausência de brute force protection
- OTP curto sem rate limit
- senha em texto claro em log ou erro
- bypass de auth via fluxo alternativo

#### Critério de Conclusão da Fase
Quando houver avaliação clara da robustez de autenticação em todos os fluxos.

#### Condições de Bloqueio da Fase
- ausência de acesso ao fluxo de autenticação
- impossibilidade de determinar como o sistema autentica

---

### Fase 3 — Sessão, Tokens e Cookies de Segurança
#### Objetivo
Avaliar a gestão do ciclo de vida de sessões, tokens e cookies, além do lifecycle de conta do usuário final.

#### Checks Obrigatórios
- verificar emissão, validação e expiração de JWTs ou tokens equivalentes
- verificar uso de secret de assinatura (HS256/RS256), separação dev/prod, rotação possível
- verificar account takeover via JWT (mesmo secret entre ambientes, algoritmos `none`/`HS256` com chave pública)
- verificar session fixation, session hijacking, regeneração de sessão pós-login
- verificar revogação ativa de sessão (logout efetivo, blacklist/whitelist quando aplicável)
- verificar flags de cookies de sessão: `Secure`, `HttpOnly`, `SameSite=Lax|Strict`, `Domain`, `Path`
- verificar timeout de sessão idle e absoluto
- verificar account lifecycle: offboarding revoga sessões ativas, transfer de ownership, dormant account detection

#### Evidências Esperadas
- código de session handler, token issuer, token validator
- configuração de cookies e flags
- middleware de sessão
- fluxos de logout e revogação
- lógica de offboarding/desativação de conta

#### Possíveis Achados
- secret JWT compartilhado entre ambientes
- algoritmo permissivo (`none`, key confusion HS/RS)
- cookie sem `Secure`, `HttpOnly` ou `SameSite`
- ausência de regeneração de sessão pós-login (fixation)
- logout que não invalida sessão de fato
- offboarding que não revoga sessões ativas
- contas dormentes sem expiração

#### Critério de Conclusão da Fase
Quando houver avaliação clara dos controles de sessão, tokens, cookies e lifecycle de conta.

#### Condições de Bloqueio da Fase
- impossibilidade de inspecionar emissão e validação de tokens
- ausência de acesso à configuração de cookies

---

### Fase 4 — Autorização e Controle de Acesso
#### Objetivo
Avaliar se o sistema aplica autorização consistente em recursos, funções e endpoints, evitando bypass por manipulação direta.

#### Checks Obrigatórios
- verificar separação clara entre autenticação e autorização
- verificar modelo de autorização (RBAC, ABAC, ReBAC) e sua implementação
- verificar IDOR / broken object level authorization (BOLA): acesso a recurso por ID modificado
- verificar broken function level authorization (BFLA): chamada direta a função privilegiada
- verificar **CSRF**: presença de anti-CSRF token, `SameSite` em cookies, double-submit cookie ou header CSRF customizado
- verificar bypass de autenticação por URL direta (páginas de "obrigado", admin escondido, fluxo pós-pagamento)
- verificar troca de role/slug via interceptação de proxy (alteração na resposta do servidor)
- verificar autorização em todas as camadas (frontend é dica, backend é verdade)

#### Evidências Esperadas
- middlewares, guards, policies, decorators
- código que valida ownership de recurso
- rotas administrativas e endpoints de função privilegiada
- formulários e APIs com proteção CSRF

#### Possíveis Achados
- IDOR/BOLA confirmado ou provável
- BFLA confirmado ou provável
- ausência total de proteção CSRF em mutations
- página sensível acessível por URL direta
- role determinada por payload do cliente
- autorização no frontend sem checagem no backend

#### Critério de Conclusão da Fase
Quando houver avaliação clara da consistência de autorização em recursos, funções e fluxos.

#### Condições de Bloqueio da Fase
- impossibilidade de identificar como o sistema autoriza
- ausência de acesso ao código de policies/guards

---

### Fase 5 — Isolamento Multi-Tenant
#### Objetivo
Avaliar se o sistema mantém isolamento estrito entre tenants em dados, processamento, cache, filas e canais laterais.

#### Checks Obrigatórios
- verificar se toda query a dados sensíveis filtra por `tenant_id` ou equivalente
- verificar uso de Row Level Security (RLS) no banco quando aplicável (Postgres/Supabase) e cobertura efetiva
- verificar se cache compartilhado (Redis, Memcached) usa chaves com `tenant_id` no namespace
- verificar se filas de jobs carregam `tenant_id` e o worker valida antes de processar
- verificar se logs e métricas não vazam dados de um tenant para outro
- verificar tenant impersonation legítima (suporte/admin) com audit log
- verificar cross-tenant leak via storage compartilhado (buckets, sistema de arquivos, anexos)

#### Evidências Esperadas
- repositórios e queries com filtros explícitos
- políticas RLS no banco
- código de cache com chaves namespaced
- código de jobs e workers
- configuração de storage compartilhado
- documentação de modelo multi-tenant

#### Possíveis Achados
- query sem filtro de tenant
- RLS ausente ou parcial em tabela sensível
- cache sem namespace de tenant
- worker que processa job de qualquer tenant sem validação
- log com dados cruzados entre tenants
- storage compartilhado sem prefixo de tenant
- impersonation sem audit log

#### Critério de Conclusão da Fase
Quando houver avaliação clara do isolamento entre tenants em todas as camadas.

#### Condições de Bloqueio da Fase
- ausência de modelo multi-tenant declarado
- impossibilidade de inspecionar queries e políticas de banco

---

### Fase 6 — IAM Administrativo
#### Objetivo
Avaliar como o sistema gerencia identidades privilegiadas (humanas e de máquina), roles administrativas e princípio de menor privilégio.

#### Checks Obrigatórios
- identificar IAM formal para acessos administrativos (console cloud, banco, painel admin interno, observabilidade paga)
- verificar roles com permissões excessivas (wildcard `*` onde caberia escopo)
- verificar separação entre contas humanas e service accounts
- verificar preferência por tokens efêmeros sobre access keys de longa duração
- verificar MFA obrigatório para acessos privilegiados
- verificar audit log para ações administrativas
- verificar processo de onboarding/offboarding e revisão periódica de acessos
- verificar Just-In-Time access para privilégios elevados quando aplicável
- verificar escopo de chaves de API/tokens emitidos para integrações

#### Evidências Esperadas
- IaC de roles/policies (IAM, RBAC)
- configuração de console cloud e provedor de identidade
- código que emite tokens com escopo declarado
- documentação de processo de acesso
- audit log configurado

#### Possíveis Achados
- role com `*:*` em produção
- root account em uso rotineiro
- access key de longa duração onde caberia token efêmero
- ausência de MFA admin
- service account compartilhada entre serviços
- ex-membros com acesso ativo
- ausência de audit log administrativo

#### Critério de Conclusão da Fase
Quando houver avaliação clara da gestão de identidades privilegiadas e aderência ao menor privilégio.

#### Condições de Bloqueio da Fase
- ausência de acesso à configuração de IAM
- impossibilidade de identificar identidades de máquina

---

### Fase 7 — Validação e Sanitização de Entrada
#### Objetivo
Avaliar se o sistema valida e sanitiza estruturalmente todas as entradas externas antes do processamento, sem confiar em controles do cliente.

#### Checks Obrigatórios
- verificar presença de validação estruturada (schemas: Zod, Joi, Pydantic, JSON Schema, DTOs tipados)
- verificar cobertura: todo endpoint público tem validação no backend
- verificar validação de tipos numéricos (negativos, fracionários, NaN, Infinity, overflow)
- verificar mass assignment / mass binding (campos sensíveis aceitos sem allowlist)
- verificar bypass de filtro por **double URL encoding** (`%252f`) ou variantes (Unicode, hex)
- verificar normalização antes da validação (Unicode NFC/NFKC, lowercase de e-mails)
- verificar tamanho máximo de payload, arrays e strings
- verificar sanitização de HTML quando o sistema renderiza conteúdo de usuário

#### Evidências Esperadas
- schemas de validação
- DTOs, serializers, parsers
- middlewares de validação
- controllers e handlers que recebem input

#### Possíveis Achados
- endpoint sem validação no backend
- número fracionário ou negativo aceito onde só caberia inteiro positivo
- mass assignment de campo sensível (`is_admin`, `tenant_id`, `price`)
- filtro contornado por double encoding
- payload sem limite de tamanho
- sanitização de HTML ausente em conteúdo renderizado

#### Critério de Conclusão da Fase
Quando houver avaliação clara da qualidade da validação estrutural em todos os pontos de entrada.

#### Condições de Bloqueio da Fase
- ausência de acesso às camadas que recebem input
- impossibilidade de relacionar input externo ao processamento

---

### Fase 8 — Injeção Clássica
#### Objetivo
Avaliar exposição a vetores clássicos de injeção em queries, comandos, templates, paths e requisições de saída do servidor.

#### Checks Obrigatórios
- verificar **SQL Injection** (uso de queries parametrizadas, ORMs corretamente, ausência de concatenação)
- verificar **NoSQL Injection** (MongoDB operators em payload, query reconstruction)
- verificar **XSS** stored, reflected e DOM-based (escape no template, framework moderno)
- verificar **Command Injection** (shell, exec, spawn com input não escapado)
- verificar **Code Injection** (eval, Function, deserialize de input)
- verificar **SSRF** (requisições outbound com URL de input, allowlist de hosts, filtro de IPs internos e metadata endpoint)
- verificar **Path Traversal / LFI** (leitura de arquivo com path de input, normalização e jail)
- verificar **Template Injection** (SSTI em Jinja, Handlebars, ERB)
- verificar **LDAP / XPath Injection** quando aplicável
- verificar **Header Injection / Response Splitting**

#### Evidências Esperadas
- repositórios e builders de query
- chamadas a `exec`, `spawn`, `system`, `eval`
- código que faz fetch outbound com URL dinâmica
- código que lê arquivo por path dinâmico
- engines de template com input externo

#### Possíveis Achados
- SQLi confirmado ou provável
- XSS por escape ausente
- command injection em wrapper de shell
- SSRF com acesso a metadata endpoint (169.254.169.254)
- LFI via `../` ou path absoluto
- SSTI em template com input

#### Critério de Conclusão da Fase
Quando houver avaliação clara da exposição a vetores clássicos de injeção.

#### Condições de Bloqueio da Fase
- impossibilidade de inspecionar queries e chamadas a sistema
- ausência de acesso ao código de templates

---

### Fase 9 — Vetores Modernos de Injeção
#### Objetivo
Avaliar exposição a vetores modernos e específicos: prompt injection em LLM, deserialization, metadata em arquivos e bombas de descompressão.

#### Checks Obrigatórios
- verificar **Prompt Injection em LLM**: input do usuário concatenado em prompt de sistema sem sandboxing, capacidade de exfiltrar instruções, jailbreak, indirect prompt injection via documento
- verificar isolamento de tools/funções expostas a LLM (deny-list de ações sensíveis, confirmação humana em operações críticas)
- verificar **Insecure Deserialization** (Pickle, Java Serialization, PHP unserialize, YAML unsafe load, .NET BinaryFormatter)
- verificar uploads quanto a **EXIF metadata injection** (PHP/script em comentários EXIF, escalação LFI→RCE quando o arquivo é incluído)
- verificar uploads quanto a **polyglot files** (arquivo válido em múltiplos formatos, ex: PDF/JS, GIFAR)
- verificar **zip bombs** e bombas de descompressão (limite de razão de descompressão e tamanho final)
- verificar **XML External Entity (XXE)** quando o sistema parsear XML
- verificar **Buffer Overflow** em código nativo ou bindings sensíveis quando aplicável

#### Evidências Esperadas
- código de prompt assembly e tool dispatch para LLM
- pontos de deserialização
- pipeline de upload e processamento de imagem/documento
- parsers de XML, ZIP, archives
- bindings nativos quando existirem

#### Possíveis Achados
- prompt do sistema concatenado com input sem delimitação
- LLM com tool poderosa sem confirmação
- deserialização de input não confiável
- upload aceita imagem com payload em metadata
- ausência de limite de descompressão
- XXE habilitado por default no parser

#### Critério de Conclusão da Fase
Quando houver avaliação clara da exposição a vetores modernos de injeção e processamento de payload.

#### Condições de Bloqueio da Fase
- impossibilidade de identificar onde LLM é invocado
- ausência de acesso ao pipeline de upload

---

### Fase 10 — Lógica de Negócio e Abuse de Fluxo
#### Objetivo
Avaliar abusos da lógica de negócio: cálculos no cliente, race conditions, manipulação de inputs aceitos por validação mas absurdos no fluxo, e bypass de regras de processo.

#### Checks Obrigatórios
- verificar **lógica de negócio crítica no frontend** (preço, score, resultado de jogo, validação de pagamento) — frontend é apresentação, backend é verdade
- verificar **race conditions** em saldo, estoque, cupom, voto, reserva (verificação e atualização não-atômicas)
- verificar manipulação numérica que passa na validação mas viola lógica (negativo, fracionário, zero, máximo, troco indevido)
- verificar replay de operação financeira ou crítica (ausência de idempotency key)
- verificar contorno de ordem de fluxo (pular passo, repetir passo, voltar a estado anterior)
- verificar bypass de payment flow (forçar URL pós-pagamento sem confirmação real)
- verificar abuse de fluxos com efeito cumulativo (signups com domínio descartável, cupom duplicado, refund loop)

#### Evidências Esperadas
- código de checkout, pagamento, scoring
- transações de banco e uso de locks/SELECT FOR UPDATE
- validações de fluxo de estado
- código frontend que executa lógica
- handlers de eventos críticos

#### Possíveis Achados
- preço calculado no frontend e aceito pelo backend
- race condition em saldo permitindo gasto duplicado
- valor negativo aceito em transferência
- replay de webhook crítico sem idempotency
- página de "obrigado" acessível sem pagamento confirmado
- cupom aplicável N vezes pelo mesmo usuário

#### Critério de Conclusão da Fase
Quando houver avaliação clara dos riscos de abuse de lógica de negócio e fluxo.

#### Condições de Bloqueio da Fase
- ausência de acesso ao código de lógica de negócio crítica
- impossibilidade de mapear fluxos de operações sensíveis

---

### Fase 11 — Criptografia e Transporte Seguro
#### Objetivo
Avaliar uso correto de criptografia simétrica, assimétrica, hashing e transporte criptografado.

#### Checks Obrigatórios
- verificar algoritmos em uso (AES-GCM/ChaCha20-Poly1305 para simétrico; ECDSA/EdDSA/RSA-PSS para assinatura; rejeitar DES, RC4, MD5, SHA-1 para uso sensível)
- verificar uso de **IV/nonce não reusado** com chaves de longa duração
- verificar **KDF apropriado** para senhas (Argon2id, scrypt, bcrypt, PBKDF2 com iteração suficiente; rejeitar MD5/SHA-1 puro)
- verificar **RNG seguro** (`crypto.randomBytes`, `secrets.token_bytes`; rejeitar `Math.random`, `rand()` para uso sensível)
- verificar gestão de chaves de criptografia (geração, rotação, separação por uso)
- verificar **TLS** (versão mínima 1.2, idealmente 1.3; ciphers modernos; HSTS configurado)
- verificar certificate pinning quando aplicável (mobile apps)
- verificar proteção contra **MITM** (TLS estrito, validação de certificado, ausência de fallback para HTTP)
- verificar storage de dados em repouso quando aplicável (encryption-at-rest, KMS)

#### Evidências Esperadas
- código que invoca primitivas criptográficas
- chamadas a libraries de hash de senha
- configuração de TLS (servidor, reverse proxy, CDN)
- configuração de KMS ou secret manager para chaves
- configuração de mobile app (pinning) quando existir

#### Possíveis Achados
- algoritmo fraco ou inadequado em uso
- IV reusado ou previsível
- senha com hash MD5/SHA-1 ou sem KDF
- `Math.random` em token de segurança
- TLS 1.0/1.1 ainda aceito
- ausência de HSTS
- fallback HTTP em redirect

#### Critério de Conclusão da Fase
Quando houver avaliação clara do uso de criptografia e transporte em todos os pontos sensíveis.

#### Condições de Bloqueio da Fase
- impossibilidade de inspecionar código que invoca crypto
- ausência de acesso à configuração de TLS

---

### Fase 12 — Proteção de Dados em I/O
#### Objetivo
Avaliar exposição indevida de dados sensíveis em respostas, logs, mensagens de erro e telemetria.

#### Checks Obrigatórios
- verificar respostas de API quanto a campos desnecessários (CPF, telefone, e-mail, hash de senha, tokens internos)
- verificar diferença entre payload interno e payload exposto (DTO de saída próprio)
- verificar logs quanto a vazamento de segredo, token, PII, payload completo de request sensível
- verificar mensagens de erro em produção (stack trace, query SQL completa, paths internos, versão exata de dependência)
- verificar redaction em logs (filtros para `password`, `token`, `secret`, `authorization`, `cookie`)
- verificar respostas de erro não-distinguíveis em fluxos sensíveis (login: "user not found" vs "wrong password")
- verificar headers de resposta que vazam tecnologia (`X-Powered-By`, `Server`, versão exata)
- verificar minimização de dados em respostas públicas

#### Evidências Esperadas
- DTOs/serializers de saída
- middleware de logging
- handlers de erro globais
- configuração de telemetria (APM, Sentry)
- inspeção de respostas em ambientes não-locais

#### Possíveis Achados
- API pública retorna CPF e telefone em endpoint de listagem
- log com payload completo incluindo senha
- stack trace em produção
- erro de login distingue "usuário inexistente" de "senha errada"
- header `X-Powered-By` revela versão exata

#### Critério de Conclusão da Fase
Quando houver avaliação clara da exposição de dados em respostas, logs e erros.

#### Condições de Bloqueio da Fase
- ausência de acesso a logs e respostas reais
- impossibilidade de inspecionar serializers

---

### Fase 13 — Headers de Segurança e Browser Hardening
#### Objetivo
Avaliar a postura de segurança da camada cliente: headers HTTP de segurança, proteções de browser e tratamento de scripts de terceiros.

#### Checks Obrigatórios
- verificar **HSTS** (`Strict-Transport-Security` com `max-age` razoável; `preload` quando aplicável)
- verificar **CSP** (`Content-Security-Policy` restritiva, idealmente com `nonce` ou `hash`; sem `'unsafe-inline'`/`'unsafe-eval'` injustificado)
- verificar `X-Frame-Options` ou `frame-ancestors` em CSP (clickjacking)
- verificar `X-Content-Type-Options: nosniff`
- verificar `Referrer-Policy` apropriado (`strict-origin-when-cross-origin` ou mais restritivo)
- verificar `Permissions-Policy` para features sensíveis (camera, microphone, geolocation, payment)
- verificar **COOP** (`Cross-Origin-Opener-Policy: same-origin`) e **COEP** quando o app exigir isolamento
- verificar **Subresource Integrity (SRI)** em `<script>` e `<link>` carregados de CDN externo
- verificar **CORS** (`Access-Control-Allow-Origin` específico, não `*` em endpoints autenticados; `Access-Control-Allow-Credentials` consistente)
- verificar **third-party JS** (analytics, GTM, chat widgets, pixels) — risco Magecart/skimming, escopo de execução, CSP cobrindo

#### Evidências Esperadas
- middleware de headers (helmet, secure_headers, equivalente)
- configuração de reverse proxy / CDN
- HTML servido com CSP e SRI
- inventário de scripts terceiros embarcados

#### Possíveis Achados
- ausência total de CSP
- CSP com `'unsafe-inline'` sem nonce
- CDN sem SRI
- CORS `*` em endpoint autenticado
- ausência de HSTS
- script terceiro de tag manager sem CSP cobrindo
- header de identificação de tecnologia (`X-Powered-By`)

#### Critério de Conclusão da Fase
Quando houver avaliação clara dos headers, browser hardening e exposição via terceiros.

#### Condições de Bloqueio da Fase
- ausência de acesso à camada que serve HTTP
- impossibilidade de inspecionar HTML/headers em ambiente representativo

---

### Fase 14 — Segredos, Lifecycle e Configuração Sensível
#### Objetivo
Avaliar gestão de segredos do sistema (geração, armazenamento, distribuição, rotação, revogação) e configurações sensíveis.

#### Checks Obrigatórios
- identificar tipos de segredos (API keys, DB password, JWT secret, encryption keys, integration tokens)
- verificar onde cada segredo vive (secret manager, env var, config file, vault)
- verificar **segredos hardcoded** em código ou commitados no git
- verificar separação total de segredos entre dev/staging/prod
- verificar política de rotação (prazo por tipo, mecanismo, quem dispara)
- verificar processo de revogação pós-incidente
- verificar `.env.example` presente, sem valores reais
- verificar configuração sensível exposta (`.env`, `.htaccess`, `web.config`, arquivos de backup)
- verificar **API keys/tokens vazados no frontend** (service keys onde caberia anon/publishable key)
- verificar **má configuração de RLS** ou regras públicas em banco (Supabase, Firebase) — referenciar `dados-persistencia` para auditoria profunda
- verificar configuração de **storage, buckets, filas e serviços externos** quando afetarem diretamente segurança (S3 público, bucket sem ACL, fila aberta, índice público em search) — referenciar `infraestrutura-deploy-config` para profundidade
- verificar **debug mode** ou comportamento permissivo em produção
- verificar **segurança por obscuridade** (rotas admin escondidas como `/zemim` confiando em descoberta)

#### Evidências Esperadas
- configuração de secret manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, Doppler, 1Password CLI)
- `.env.example` e variáveis de ambiente
- arquivos de configuração e manifests
- chaves embarcadas no bundle frontend
- regras de banco (RLS, Firestore rules)
- políticas e scripts de rotação

#### Possíveis Achados
- segredo hardcoded
- mesmo secret em dev e prod
- `.env` real exposto via web
- service key do banco no frontend
- RLS ausente em tabela com leitura pública
- debug mode em produção
- rota admin protegida só por obscuridade

#### Critério de Conclusão da Fase
Quando houver avaliação clara do ciclo de vida de segredos e configuração sensível.

#### Condições de Bloqueio da Fase
- impossibilidade de identificar onde segredos vivem
- ausência de acesso a manifests e env

---

### Fase 15 — Webhooks e Integrações Externas
#### Objetivo
Avaliar segurança de webhooks recebidos, integrações outbound e chamadas a serviços externos.

#### Checks Obrigatórios
- verificar **assinatura** de webhooks recebidos (HMAC, signed JWT) e validação correta no handler
- verificar proteção contra **replay** (timestamp + janela de tolerância; nonce ou idempotency)
- verificar **idempotência** de operações disparadas por webhook
- verificar tratamento de falha (retry com backoff, dead-letter queue, alerta)
- verificar credenciais usadas em integrações outbound (escopo mínimo, segregação por integração)
- verificar tratamento de erro de integração externa (timeout, fallback, mensagem segura ao usuário)
- verificar validação de origem (IP allowlist quando o provedor publica; mTLS quando aplicável)
- verificar logging de eventos de integração sem vazar credenciais

#### Evidências Esperadas
- handlers de webhook
- código de assinatura/validação
- configuração de retry e DLQ
- credenciais de integrações
- documentação dos provedores integrados

#### Possíveis Achados
- webhook sem verificação de assinatura
- janela de replay sem mitigação
- handler não-idempotente em operação financeira
- credencial de integração com escopo excessivo
- log com payload completo incluindo dados do parceiro

#### Critério de Conclusão da Fase
Quando houver avaliação clara da segurança de webhooks e integrações.

#### Condições de Bloqueio da Fase
- ausência de acesso aos handlers
- impossibilidade de identificar como integrações são configuradas

---

### Fase 16 — E-mail, Domínio e DNS
#### Objetivo
Avaliar postura de segurança do domínio, e-mail e DNS — vetores frequentemente usados para phishing, spoofing e takeover de subdomínio.

#### Checks Obrigatórios
- verificar **SPF** (registro `v=spf1` correto, `-all` ou `~all`, lista de senders autorizados)
- verificar **DKIM** (chave publicada, assinatura ativa em e-mails enviados)
- verificar **DMARC** (registro `v=DMARC1`, política `quarantine` ou `reject`, relatórios `rua`/`ruf`)
- verificar **BIMI** quando aplicável
- verificar **DNSSEC** habilitado no domínio
- verificar **registrar lock** ativado contra transferência indevida
- verificar **subdomain takeover**: CNAMEs órfãos apontando para serviços descomissionados (Heroku, S3, Github Pages, Azure)
- verificar inventário de subdomínios e seu propósito (shadow subdomains)
- verificar configuração de e-mail transacional do produto (SES, SendGrid, Postmark) com domínio próprio autenticado

#### Evidências Esperadas
- registros DNS do domínio
- configuração no provedor de e-mail
- inventário de subdomínios (`crt.sh`, `subfinder`, registros internos)
- documentação operacional de domínio

#### Possíveis Achados
- SPF ausente, com `+all` ou senders demais
- DKIM não configurado
- DMARC em `none` (apenas observa)
- DNSSEC desabilitado
- registrar lock desativado
- CNAME órfão apontando para serviço removido
- subdomínio esquecido com app antigo vulnerável

#### Critério de Conclusão da Fase
Quando houver avaliação clara da postura de e-mail, domínio e DNS.

#### Condições de Bloqueio da Fase
- ausência de acesso a registros DNS
- impossibilidade de inventariar subdomínios

---

### Fase 17 — Esteira CI de Segurança (SAST/DAST/Secret Scanning)
#### Objetivo
Avaliar automação de segurança no pipeline de desenvolvimento: SAST, DAST, secret scanning e gates de qualidade de segurança.

#### Checks Obrigatórios
- verificar presença de **SAST** (análise estática) no CI (Semgrep, SonarQube, CodeQL, Snyk Code)
- verificar presença de **DAST** (análise dinâmica) periódica ou em staging (OWASP ZAP, Burp, Nuclei)
- verificar **secret scanning** em commits e branches (gitleaks, trufflehog, GitHub Secret Scanning, GitGuardian)
- verificar gate no PR que bloqueia merge com finding crítico
- verificar **dependency scanning** integrado (referenciar `supply-chain-dependencias` para auditoria do domínio próprio)
- verificar processo de triagem e tratamento de findings (não apenas gerar alerta sem dono)
- verificar **pentesting periódico** (interno ou externo) com cadência declarada
- verificar `security.txt` apontando canal de disclosure (referenciado também na F18)

#### Evidências Esperadas
- workflows de CI (`.github/workflows`, `.gitlab-ci.yml`, equivalente)
- configuração de scanners
- documentação de processo de triagem
- relatórios de pentest passados
- `.well-known/security.txt`

#### Possíveis Achados
- nenhum SAST configurado
- secret scanning ausente
- finding crítico ignorado por meses sem dono
- DAST nunca rodado
- ausência de cadência de pentest
- `security.txt` ausente

#### Critério de Conclusão da Fase
Quando houver avaliação clara da automação de segurança no CI e do processo humano associado.

#### Condições de Bloqueio da Fase
- ausência de acesso ao CI/pipeline
- impossibilidade de identificar processo de triagem

---

### Fase 18 — Detecção, Audit Log e Resposta a Incidente
#### Objetivo
Avaliar capacidade de detectar comportamento anômalo, registrar audit log apropriado e responder a incidentes de segurança.

#### Checks Obrigatórios
- verificar **audit log** de eventos sensíveis (login, mudança de role, ação administrativa, exportação de dados, acesso a recurso crítico)
- verificar imutabilidade ou proteção do audit log
- verificar **detecção de anomalia**: failed logins em massa, login de geo improvável, escalação de privilégio, acesso fora de horário
- verificar pipeline de alertas (SIEM, Datadog Security, Sentry, custom) com destinatários definidos
- verificar **runbook de incident response** (quem é acionado, como conter, como comunicar, como preservar evidência)
- verificar **`security.txt`** publicado em `.well-known/security.txt` com canal de disclosure responsável
- verificar processo de bug bounty ou disclosure responsável quando aplicável
- verificar capacidade de invalidar massivamente sessões/tokens em incidente
- verificar **proteção de backups** (referenciar `confiabilidade-resiliencia` para imutabilidade vs ransomware)

#### Evidências Esperadas
- código de audit log
- configuração de SIEM ou agregador
- runbook de IR documentado
- `.well-known/security.txt`
- canais de comunicação de incidente
- mecanismo de revogação massiva

#### Possíveis Achados
- ações administrativas sem audit log
- audit log mutável
- sem detecção de anomalia em login
- alerta sem dono
- IR não documentado
- `security.txt` ausente
- revogação massiva impossível na prática

#### Critério de Conclusão da Fase
Quando houver avaliação clara da capacidade de detectar, auditar e responder a incidentes.

#### Condições de Bloqueio da Fase
- ausência de acesso à infraestrutura de log
- impossibilidade de validar que alertas chegam a alguém

---

### Fase 19 — Bot/Abuse Protection e Hardening Operacional
#### Objetivo
Avaliar proteção contra abuso automatizado, rate limiting em endpoints sensíveis e hardening operacional do runtime.

#### Checks Obrigatórios
- verificar **rate limiting** por IP, por conta, por endpoint (proporcional à sensibilidade)
- verificar **WAF** ativo (Cloudflare, AWS WAF, fastly, custom) com regras OWASP
- verificar **CAPTCHA** em endpoints críticos (signup, login após N falhas, formulário público, password reset)
- verificar **bot detection** (device fingerprint, behavior analytics) quando o produto justifica
- verificar proteção contra **DDoS** na borda (CDN, Anycast, scrubbing)
- verificar barreiras mínimas em endpoints administrativos, internos ou de manutenção
- verificar **hardening de runtime**: container não-root, read-only filesystem onde possível, seccomp/AppArmor (referenciar `infraestrutura-deploy-config` para profundidade)
- verificar defaults de segurança em ambientes não-locais (debug off, verbose off, CORS restritivo)
- verificar tratamento de **arquivos maliciosos no upload** (antivírus, sandbox de processamento)

#### Evidências Esperadas
- middleware de rate limit
- configuração de WAF/CDN
- integração de CAPTCHA
- configuração de container/runtime
- pipeline de processamento de upload

#### Possíveis Achados
- endpoint sensível sem rate limit
- ausência de WAF
- CAPTCHA ausente em fluxos de signup/reset
- container rodando como root
- defaults permissivos em produção
- upload sem qualquer scan

#### Critério de Conclusão da Fase
Quando houver avaliação clara da postura contra abuso e do hardening operacional mínimo.

#### Condições de Bloqueio da Fase
- ausência de acesso à configuração de borda (CDN/WAF)
- impossibilidade de avaliar runtime real

---

### Fase 20 — Consolidação de Achados e Preparação para Finalização
#### Objetivo
Consolidar todos os achados levantados nas fases anteriores e preparar a run para transição a `ready_for_finalize`.

#### Checks Obrigatórios
- revisar coerência entre achados e evidências
- remover duplicidades (especialmente em vetores que cruzam fases: brute force/login vs rate limit; cookie flags em sessão vs headers; segredos no frontend vs config sensível)
- confirmar severidades
- revisar status dos achados
- separar achados realmente de segurança de achados cujo núcleo pertença a outro domínio (referenciar sem reauditar)
- destacar os riscos exploráveis ou de maior impacto
- revisar escopo executado e escopo não coberto
- preencher `relatorio-final.md`
- confirmar riscos prioritários e recomendações prioritárias
- verificar bloqueios abertos
- confirmar avaliação geral do domínio
- atualizar `acompanhamento.md` com próximo passo coerente

#### Evidências Esperadas
- `achados.md` atualizado
- `relatorio-final.md` preenchido
- `acompanhamento.md` atualizado
- `metadata.md` pronto para transição de estado
- referências consistentes no histórico
- severidades coerentes
- diferenciação entre fragilidade, hipótese e problema confirmado

#### Possíveis Achados
- duplicidade de achado entre fases relacionadas
- severidade inconsistente
- lacuna de evidência
- classificação inadequada de domínio
- risco importante subavaliado
- relatório final inconsistente
- bloqueio em aberto sem decisão

#### Critério de Conclusão da Fase
A run deve estar pronta para ser marcada como `ready_for_finalize` com todos os achados consolidados, sem duplicidade e classificados de modo coerente.

#### Condições de Bloqueio da Fase
- histórico inconsistente
- ausência de evidência mínima para consolidar
- conflito estrutural nos registros da run
- risco crítico sem tratamento documental mínimo

---

## Ordem Oficial das Fases
1. Threat Modeling e Mapeamento de Superfície
2. Autenticação
3. Sessão, Tokens e Cookies de Segurança
4. Autorização e Controle de Acesso
5. Isolamento Multi-Tenant
6. IAM Administrativo
7. Validação e Sanitização de Entrada
8. Injeção Clássica
9. Vetores Modernos de Injeção
10. Lógica de Negócio e Abuse de Fluxo
11. Criptografia e Transporte Seguro
12. Proteção de Dados em I/O
13. Headers de Segurança e Browser Hardening
14. Segredos, Lifecycle e Configuração Sensível
15. Webhooks e Integrações Externas
16. E-mail, Domínio e DNS
17. Esteira CI de Segurança (SAST/DAST/Secret Scanning)
18. Detecção, Audit Log e Resposta a Incidente
19. Bot/Abuse Protection e Hardening Operacional
20. Consolidação de Achados e Preparação para Finalização

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
7. Cada fase deve produzir achados próprios — quando um vetor cruzar fases (ex: brute force em login vs rate limit geral), registrar na fase mais específica e referenciar nas demais sem duplicar.

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
- Este playbook audita segurança de aplicação, identidade, criptografia, browser, periferia (webhooks/DNS/e-mail) e operação defensiva.
- Vulnerabilidades profundas de arquitetura, observabilidade, testes, performance, infraestrutura, supply chain, dados ou compliance devem ser tratadas também em seus domínios próprios quando forem o núcleo do problema.
- Quando um problema de outro domínio afetar diretamente segurança, ele pode ser citado aqui como impacto de segurança, sem substituir a auditoria específica daquele domínio.
- Engenharia social (falso suporte, deepfakes, macros maliciosas), shadow IT/AI, ransomware organizacional e ataques DNS de infraestrutura externa estão **fora do escopo** desta auditoria técnica de código e configuração — pertencem a controles organizacionais, awareness e operação de infraestrutura corporativa.
