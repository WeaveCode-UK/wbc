# Achados da Auditoria

## Identificação
- dominio: compliance-privacidade
- run_id: 2026-04-19_21-00-11
- ultima_atualizacao: 2026-04-19 21:15:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Observações Preliminares
Esta auditoria é técnica, não substituindo parecer jurídico. Referências: LGPD (Lei 13.709/2018) e GDPR (quando aplicável por integrações). Vários achados apontam para necessidade de revisão pelo encarregado de dados (DPO). Alguns achados dependem de processos organizacionais fora do repositório (contratos, políticas).

## Achados Registrados

### ACH-001
- titulo: Ausência de endpoints para direitos do titular (acesso, correção, portabilidade, exclusão)
- severidade: critico
- categoria: direitos-do-titular
- status: confirmado
- resumo: Não há endpoints para cumprir os direitos previstos nos arts. 18-22 da LGPD (acesso, correção, portabilidade, exclusão/esquecimento). Grep por "export", "portability", "delete_account", "forget", "lgpd", "gdpr" retorna zero em routers/handlers.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/*; packages/business/*/use-cases/*; ausência de módulo `privacy`/`gdpr`

#### Impacto
- tecnico: Impossível atender solicitação regulatória no prazo
- negocio: Multa até R$ 50M ou 2% do faturamento (LGPD art. 52)

#### Recomendacao
- acao_sugerida: Implementar 4 endpoints tRPC (`privacy.exportMyData`, `privacy.correctField`, `privacy.requestDeletion`, `privacy.accessLog`); OTP obrigatório; registro em AuditLog; ZIP com JSON por domínio
- prioridade: alta

---

### ACH-002
- titulo: Ausência de política de privacidade pública e acessível
- severidade: critico
- categoria: transparencia
- status: confirmado
- resumo: Não há `PRIVACY_POLICY.md`, nem link em apps/web / apps/landing / apps/mobile. Onboarding não solicita aceite de termos.

#### Evidencia
- arquivo_ou_area: docs/ (sem POLICY); apps/web/src/app/(auth)/onboarding/page.tsx (sem checkbox de termos)

#### Impacto
- tecnico: Sem basis legal documentada (LGPD art. 7-8)
- negocio: Não conformidade clara; titulares sem informação

#### Recomendacao
- acao_sugerida: `docs/PRIVACY_POLICY.md` (PT-BR + EN) cobrindo dados coletados, bases legais, direitos, retenção, sub-processadores, transferências; publicar na landing (rodapé), onboarding (checkbox obrigatório), mobile (tela inicial)
- prioridade: alta

---

### ACH-003
- titulo: Sem mecanismo formal de consentimento (LGPD art. 7.I)
- severidade: critico
- categoria: consentimento
- status: confirmado
- resumo: Onboarding coleta dados sem checkbox de aceite. Não há tabela `ConsentLog` nem campo `consentedAt`/`marketingConsent` em Client ou Account.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (sem ConsentLog); apps/web/src/app/(auth)/onboarding/page.tsx

#### Impacto
- tecnico: Envio de campanhas sem base legal apropriada
- negocio: Multa LGPD; reputação

#### Recomendacao
- acao_sugerida: Modelo `ConsentLog(accountId, type, version, grantedAt, revokedAt, source)`; checkbox explícito no onboarding; relatório de consentimento exportável
- prioridade: alta

---

### ACH-004
- titulo: Dados sensíveis em campo livre (`notes`) e `allergies` sem classificação
- severidade: critico
- categoria: categorias-especiais
- status: confirmado
- resumo: `Client.allergies` (dado de saúde) e `Client.notes`/`preferences` em texto livre possibilitam coleta de categorias especiais sem consentimento reforçado (LGPD art. 5.II + art. 11).

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (modelo Client)

#### Impacto
- tecnico: Sem marcação de sensibilidade; mascaramento não ocorre em logs
- negocio: Tratamento indevido de dados de saúde

#### Recomendacao
- acao_sugerida: Marcar campos como `SENSITIVE`; consentimento específico na criação de Client; redação automática em logs/Sentry
- prioridade: alta

---

### ACH-005
- titulo: Transferência internacional de dados (USA/China) sem safeguards documentados
- severidade: critico
- categoria: transferencia-internacional
- status: confirmado
- resumo: Stack envia dados a Sentry (USA), DeepSeek (China), GitHub (USA), Resend (USA), WhatsApp (Meta, global), MercadoPago (Argentina/regional). LGPD art. 33 exige safeguards (SCC, BCR, consentimento específico, decisão de adequação) e GDPR art. 44-49 exige mecanismo equivalente.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts; packages/business/ai/adapters/deepseek-adapter.ts; ausência de DPAs/SCCs em docs/

#### Impacto
- tecnico: Dados pessoais e sensíveis expostos a jurisdições não-adequadas
- negocio: Multa relevante; perda de contratos

#### Recomendacao
- acao_sugerida: SCCs com cada sub-processador (ou BCRs); redação de PII antes de enviar (Sentry beforeSend, prompts DeepSeek sem PII); documentar em `docs/SUB_PROCESSORS.md`; consentimento explícito para processamento em terceiro país
- prioridade: alta

---

### ACH-006
- titulo: DPIA/RIPD (relatório de impacto à proteção de dados) inexistente
- severidade: alto
- categoria: governanca
- status: confirmado
- resumo: LGPD art. 38 e GDPR art. 35 exigem DPIA para tratamento de larga escala/dados sensíveis. Nenhum documento `docs/DPIA.md`/`RIPD.md` existe.

#### Evidencia
- arquivo_ou_area: docs/ (sem DPIA/RIPD)

#### Impacto
- tecnico: Sem análise de risco formal
- negocio: Indefensável em fiscalização

#### Recomendacao
- acao_sugerida: Produzir DPIA cobrindo inventário, bases legais, riscos, mitigações, revisões; revisão anual
- prioridade: alta

---

### ACH-007
- titulo: Sub-processadores não documentados (sem DPA)
- severidade: alto
- categoria: terceiros
- status: confirmado
- resumo: Integrações com Sentry, WhatsApp, MercadoPago, Resend, DeepSeek, Google OAuth e GitHub não têm DPA listado nem relação pública. Requerido pela LGPD art. 6.VIII e GDPR art. 28.

#### Evidencia
- arquivo_ou_area: docs/ (sem SUB_PROCESSORS/DPA)

#### Impacto
- tecnico: Responsabilidade compartilhada não definida
- negocio: Violação disseminada em caso de breach em terceiro

#### Recomendacao
- acao_sugerida: Publicar `docs/SUB_PROCESSORS.md` com nome, país, finalidade, DPA/SCC, local de armazenamento; notificar titulares em mudança
- prioridade: alta

---

### ACH-008
- titulo: Sentry sem `beforeSend` — PII e segredos podem vazar
- severidade: alto
- categoria: minimizacao-logs
- status: confirmado
- resumo: `apps/api/src/lib/sentry.ts` e `apps/web/sentry.*.config.ts` não implementam `beforeSend`/`beforeBreadcrumb`, deixando emails, tokens, stack frames com PII serem enviados (cross-ref seguranca/ACH-021).

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts; apps/web/sentry.server.config.ts

#### Impacto
- tecnico: Exposição de PII em serviço terceiro (USA)
- negocio: Violação de minimização e transferência internacional

#### Recomendacao
- acao_sugerida: `beforeSend` que redacta `authorization`, `password`, `token`, e-mails e telefones; `beforeBreadcrumb` com mesma regra; elevar para exception pipeline com sampling coerente
- prioridade: alta

---

### ACH-009
- titulo: Security-logger e logs gerais sem redaction de PII
- severidade: alto
- categoria: minimizacao-logs
- status: confirmado
- resumo: `packages/shared/src/security-logger.ts` serializa `phone`/`userId`/`tenantId` em claro; logging-middleware loga tenant/user sem máscara (cross-ref seguranca/ACH-019/020).

#### Evidencia
- arquivo_ou_area: packages/shared/src/security-logger.ts:22-44; apps/api/src/trpc/logging-middleware.ts

#### Impacto
- tecnico: PII em stdout e pipelines de agregação
- negocio: Falha de minimização LGPD

#### Recomendacao
- acao_sugerida: Função de redação central (`maskPhone`, `maskEmail`, trunc ID), aplicada em todos os logs; regra ESLint para bloquear logs de PII
- prioridade: alta

---

### ACH-010
- titulo: Política de retenção ausente — dados podem persistir indefinidamente
- severidade: alto
- categoria: retencao
- status: confirmado
- resumo: Sem `docs/DATA_RETENTION_POLICY.md`; apenas outbox-cleanup remove eventos PROCESSED. Clients, Sessions, Sales, OTP expirado crescem infinitamente.

#### Evidencia
- arquivo_ou_area: docs/ (sem retention); apps/worker/src/processors/outbox-cleanup.ts

#### Impacto
- tecnico: Storage cresce, backup também; risco de vazamento em histórico
- negocio: Violação LGPD art. 15/16

#### Recomendacao
- acao_sugerida: Política por entidade (ex.: Client inativo 3 anos → anonimização; Sessions 14 dias; Logs 90 dias; OTP consumido 24 h); worker de cleanup/anonimização
- prioridade: alta

---

### ACH-011
- titulo: Direito ao esquecimento depende de hard-delete + propagação em backups
- severidade: alto
- categoria: direito-ao-esquecimento
- status: confirmado
- resumo: Soft-delete parcial (`TenantMember.deletedAt`), sem pipeline de anonimização. Backups retêm dados 30 dias após exclusão. Não atende LGPD art. 18.IV adequadamente.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma; deploy/backup/backup.sh; cross-ref dados-persistencia/ACH-008, dados-persistencia/ACH-019

#### Impacto
- tecnico: Exclusão não é irreversível
- negocio: Obrigação legal descumprida

#### Recomendacao
- acao_sugerida: Função `anonymizeClient(id)` (substituir name/email/phone por valores opacos, marcar `anonymizedAt`); job que propaga anonimização aos backups antigos ou encurta retenção; registrar evento de esquecimento
- prioridade: alta

---

### ACH-012
- titulo: Campanhas de marketing sem confirmação de opt-in registrado
- severidade: alto
- categoria: marketing-e-consentimento
- status: confirmado
- resumo: Não há `marketingConsent` em Client; `CampaignRecipient` entra em PENDING→SENT sem verificação. Ausência de "unsubscribe" padronizado nos templates.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (Campaign, Client); templates (não localizados)

#### Impacto
- tecnico: Envio sem base legal
- negocio: Multa LGPD art. 7.VI, risco reputacional

#### Recomendacao
- acao_sugerida: Campo `marketingConsent` + `marketingConsentSource` + `marketingRevokedAt`; bloquear envio quando `false`; rodapé "cancelar" em templates; endpoint opt-out
- prioridade: alta

---

### ACH-013
- titulo: DPO (encarregado de dados) não nomeado e canal de contato ausente
- severidade: alto
- categoria: governanca
- status: confirmado
- resumo: LGPD art. 41 recomenda DPO e canal explícito; GDPR obriga para certos casos. Sem `dpo@weavecode.co.uk` publicado; sem entrada em docs/.

#### Evidencia
- arquivo_ou_area: ausência em docs/, README, landing

#### Impacto
- tecnico: Canal de resposta não existe
- negocio: Fiscalização agravada

#### Recomendacao
- acao_sugerida: Nomear DPO (interno/externo); publicar nome, e-mail, telefone; incluir em PRIVACY_POLICY e rodapé
- prioridade: alta

---

### ACH-014
- titulo: Criptografia em repouso não confirmada (Postgres/backup)
- severidade: alto
- categoria: seguranca-de-dados
- status: confirmado
- resumo: `docker-compose.prod.yml` usa `postgres:16-alpine` sem encryption-at-rest explícito; `backup.sh` gera `pg_dump | gzip` sem GPG. Volumes não têm indicação de LUKS/EBS.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml; deploy/backup/backup.sh

#### Impacto
- tecnico: Dados em disco/backup em claro
- negocio: Risco alto em perda de hardware / backup

#### Recomendacao
- acao_sugerida: Volume do host com LUKS (se VPS) ou EBS encryption; `pgcrypto` para campos especialmente sensíveis; backups cifrados com GPG + chave gerida em secret manager
- prioridade: alta

---

### ACH-015
- titulo: Plano de resposta a incidente inexistente (LGPD art. 48)
- severidade: alto
- categoria: incidentes
- status: confirmado
- resumo: Sem `docs/INCIDENT_RESPONSE.md` com procedimento de detecção, contenção, notificação ANPD (prazo de até 2 dias úteis), comunicação a titulares.

#### Evidencia
- arquivo_ou_area: docs/ (sem runbook de incidente de privacidade)

#### Impacto
- tecnico: Resposta lenta
- negocio: Agravante em fiscalização

#### Recomendacao
- acao_sugerida: `docs/INCIDENT_RESPONSE_PRIVACY.md` com fluxograma, papéis, modelos de comunicação ANPD e titulares; drill anual
- prioridade: alta

---

### ACH-016
- titulo: Cookie consent / Preferences Center ausentes em web e landing
- severidade: medio
- categoria: cookies
- status: confirmado
- resumo: NextAuth usa cookies de sessão; analytics podem entrar no futuro. Sem banner/seletor de consentimento nem documentação (LGPD art. 7, GDPR art. 7).

#### Evidencia
- arquivo_ou_area: apps/web, apps/landing (sem cookie-consent banner/plug-in)

#### Impacto
- tecnico: Rastreamento sem consentimento
- negocio: Multa GDPR mais agressiva em usuários EU

#### Recomendacao
- acao_sugerida: Plug-in (ex.: `vanilla-cookieconsent`, `cookiebot`); documentar cookies em PRIVACY_POLICY; respeitar preferência
- prioridade: media

---

### ACH-017
- titulo: RLS habilitado mas sem teste automatizado (cross-ref dados-persistencia/ACH-004)
- severidade: medio
- categoria: controle-tecnico
- status: confirmado
- resumo: Isolamento multi-tenant via RLS é defesa crítica para compliance; porém não há teste em CI que impeça regressão.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/migrations/manual/001_rls_policies.sql; ausência de suíte de teste

#### Impacto
- tecnico: Regressão silenciosa = vazamento cross-tenant
- negocio: Breach grave

#### Recomendacao
- acao_sugerida: Suite de testes (dois tenants, verificar isolamento com e sem middleware); executar em CI
- prioridade: alta

---

### ACH-018
- titulo: Consultora (tenant) sem clareza sobre papel (controlador x operador)
- severidade: medio
- categoria: governanca
- status: confirmado
- resumo: Consultora cadastra e gerencia clientes finais; WBC é operador (processor). Sem contrato DPA ou termos claros definindo responsabilidades, direitos e obrigações.

#### Evidencia
- arquivo_ou_area: docs/ (sem TERMOS_DE_SERVICO/DPA consultora); PRIVACY_POLICY ausente

#### Impacto
- tecnico: Responsabilidades legais difusas
- negocio: Fricção em fiscalização e contratos

#### Recomendacao
- acao_sugerida: Termos de serviço com cláusula DPA para cada tenant; modelo de PRIVACY_POLICY que consultora pode publicar aos seus clientes
- prioridade: media

---

### ACH-019
- titulo: Onboarding e registros não informam transferência internacional
- severidade: medio
- categoria: transparencia
- status: confirmado
- resumo: Consultora não é avisada de que dados serão processados por Sentry (USA), DeepSeek (China), GitHub (USA), etc. Sem checkbox consentindo com transferência internacional.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/onboarding/page.tsx

#### Impacto
- tecnico: Sem informação adequada
- negocio: Reforça ACH-005 em não conformidade

#### Recomendacao
- acao_sugerida: Step de aviso + checkbox explícito; registrar consentimento em ConsentLog com versão
- prioridade: media

---

### ACH-020
- titulo: Sem auditoria de acessos a dados pessoais (AuditLog)
- severidade: medio
- categoria: auditabilidade
- status: confirmado
- resumo: Não há tabela `AuditLog`/`AccessLog` registrando quem acessou/alterou dados pessoais. LGPD art. 37 exige capacidade de demonstrar tratamento.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (sem AuditLog); cross-ref observabilidade/ACH-024

#### Impacto
- tecnico: Impossível responder "quem acessou meus dados?"
- negocio: Fragilidade em solicitação regulatória

#### Recomendacao
- acao_sugerida: Modelo `AuditLog(tenantId, actorId, actorType, action, resource, resourceId, ip, userAgent, diff, createdAt)`; middleware para capturar mutations; visão filtrável por titular
- prioridade: alta

---

### ACH-021
- titulo: Falta processo de revisão/atualização periódica das políticas
- severidade: baixo
- categoria: governanca
- status: confirmado
- resumo: Sem definição de cadência de revisão (mínimo anual ou após mudança material). Mesmo quando houver política, processo não se automantém.

#### Evidencia
- arquivo_ou_area: docs/ (sem seção "last reviewed")

#### Impacto
- tecnico: Documentos ficam obsoletos
- negocio: Falha de due diligence

#### Recomendacao
- acao_sugerida: Rodar revisão anual; registro "última atualização" + "próxima revisão"; checklist documental
- prioridade: baixa

---

### ACH-022
- titulo: Formulários não possuem link rápido para "Direitos do Titular"
- severidade: baixo
- categoria: transparencia
- status: confirmado
- resumo: Onboarding/auth/forms não exibem link pequeno "conheça seus direitos" apontando para PRIVACY_POLICY.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/onboarding/page.tsx; apps/web/src/components/form-field.tsx

#### Impacto
- tecnico: Baixa visibilidade dos direitos
- negocio: Titular não descobre como acionar

#### Recomendacao
- acao_sugerida: Elemento textual "Conheça seus direitos" em rodapé/help dos forms sensíveis
- prioridade: baixa
