# Achados da Auditoria

## Identificação
- dominio: dados-persistencia
- run_id: 2026-03-26_02-20-00
- ultima_atualizacao: 2026-03-26 02:40:00

## Achados Registrados

### ACH-001
- titulo: Operacoes multi-step criticas sem transacao explicita
- severidade: alto
- categoria: transacoes e atomicidade
- status: confirmado
- resumo: confirmSale (updateStatus + create cashback + publish event), stock decrement (loop de updates individuais por produto) e cashback.use (loop de updates individuais) nao usam prisma.$transaction(). Zero chamadas a $transaction encontradas em todo o codebase.

#### Evidencia
- arquivo_ou_area: packages/business/sales/use-cases/confirm-sale.ts, packages/business/inventory/adapters/prisma-stock-repository.ts (linhas 25-30), packages/business/sales/adapters/prisma-cashback-repository.ts (linhas 28-45)
- detalhe: Grep por prisma.$transaction retorna zero resultados em todo packages/business e apps/api.

#### Impacto
- tecnico: Se step 2 falhar apos step 1 completar, dados ficam em estado inconsistente. Venda confirmada sem cashback, ou estoque decrementado parcialmente.
- negocio: Risco financeiro — venda pode ser confirmada mas cashback nao gerado, ou estoque de um produto decrementado mas outro nao.

#### Recomendacao
- acao_sugerida: Envolver confirmSale, stock decrement e cashback.use em prisma.$transaction(). Garantir atomicidade de operacoes multi-step.
- prioridade: alta

#### Observacoes
- Prisma nested creates (ex: sale + items) sao implicitas — OK. O problema e nos fluxos que combinam multiplas operacoes independentes.

---

### ACH-002
- titulo: Race condition em cashback.use e stock decrement por loop sem locking
- severidade: alto
- categoria: concorrencia
- status: confirmado
- resumo: cashback.use() itera cashbacks com update individual. Stock decrement itera items com update individual. Chamadas concorrentes podem causar lost updates — cashback usado em excesso ou estoque over-decremented.

#### Evidencia
- arquivo_ou_area: packages/business/sales/adapters/prisma-cashback-repository.ts (linhas 28-45, loop de updates), packages/business/inventory/adapters/prisma-stock-repository.ts (linhas 25-30)
- detalhe: Prisma { decrement } e atomico por statement individual, mas loop de multiplos decrements nao e atomico no conjunto. Sem SELECT FOR UPDATE ou optimistic locking.

#### Impacto
- tecnico: Duas vendas concorrentes para mesmo cliente podem consumir cashback alem do saldo. Estoque pode ficar negativo.
- negocio: Perda financeira por cashback duplicado. Overselling de produtos.

#### Recomendacao
- acao_sugerida: Envolver loops em $transaction com isolamento Serializable ou usar SELECT FOR UPDATE. Alternativa: adicionar campo version para optimistic locking.
- prioridade: alta

#### Observacoes
- none

---

### ACH-003
- titulo: 10 tabelas tenant-scoped potencialmente sem RLS policies
- severidade: medio
- categoria: integridade multi-tenant
- status: confirmado
- resumo: RLS habilitado para 24 tabelas, mas TeamMember, TeamTask, Delivery, LandingPage, OnboardingProgress, Notification, Referral e outras podem estar sem policies. O manual de RLS (001_rls_policies.sql) cobre 24 tabelas mas o schema tem 31+ tabelas com tenantId.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/migrations/manual/001_rls_policies.sql (24 tabelas), packages/db/prisma/schema.prisma (31+ modelos com tenantId)
- detalhe: Tabelas como team_members, team_tasks, deliveries, landing_pages, onboarding_progress, notifications nao aparecem no script RLS.

#### Impacto
- tecnico: Sem RLS, essas tabelas dependem apenas da aplicacao para isolamento tenant. Bug no codigo expoe dados cross-tenant.
- negocio: Risco de vazamento de dados de equipes, entregas e configuracoes de landing entre tenants.

#### Recomendacao
- acao_sugerida: Completar policies RLS para todas as tabelas com tenantId. Revisar script 001_rls_policies.sql.
- prioridade: media

#### Observacoes
- RLS e defesa em profundidade — middleware de tenant ja filtra na camada de aplicacao. Mas RLS e a ultima barreira.

---

### ACH-004
- titulo: Stock sem constraint @@unique([tenantId, productId])
- severidade: medio
- categoria: integridade de modelo
- status: confirmado
- resumo: Modelo Stock tem @@index([tenantId]) mas nao tem @@unique([tenantId, productId]). E possivel criar dois registros de estoque para o mesmo produto no mesmo tenant.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (modelo Stock)
- detalhe: Stock possui tenantId e productId como campos separados, com @@index([tenantId]) apenas. Sem unique constraint composto.

#### Impacto
- tecnico: Dados de estoque duplicados para mesmo produto. Queries de listagem podem retornar multiplas linhas quando esperavam uma.
- negocio: Estoque impreciso — consultora pode ver valores errados.

#### Recomendacao
- acao_sugerida: Adicionar @@unique([tenantId, productId]) ao modelo Stock.
- prioridade: media

#### Observacoes
- none

---

### ACH-005
- titulo: 6 foreign keys sem onDelete cascade — risco de orphaned records
- severidade: medio
- categoria: integridade referencial
- status: confirmado
- resumo: Sale.clientId, SaleItem.productId, Cashback.clientId, CampaignRecipient.clientId, Referral.referrerId e Sale.campaignId nao especificam onDelete. Se o registro pai for deletado, registros filhos ficam orfaos.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (modelos Sale, SaleItem, Cashback, CampaignRecipient, Referral)
- detalhe: Relacoes definidas com @relation sem onDelete: Cascade ou onDelete: SetNull. Default Prisma e "Restrict" (bloqueia delete), mas comportamento pode variar.

#### Impacto
- tecnico: Tentativa de deletar client com vendas associadas pode falhar silenciosamente ou gerar FK violation. Ou, se forcado, deixa vendas sem cliente.
- negocio: Dificuldade de remover clientes (LGPD). Dados orfaos poluem relatorios.

#### Recomendacao
- acao_sugerida: Definir explicitamente onDelete para cada FK: Cascade (se deve deletar junto), SetNull (se deve manter orfao), ou Restrict (se deve bloquear). Documentar a decisao.
- prioridade: media

#### Observacoes
- none

---

### ACH-006
- titulo: OutboxEvent sem cleanup — tabela cresce indefinidamente
- severidade: medio
- categoria: ciclo de vida dos dados
- status: confirmado
- resumo: Tabela outbox_events nao possui job de cleanup para eventos PROCESSED. Nao ha TTL, archival ou purge configurado. Tabela cresce indefinidamente com cada evento publicado.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (modelo OutboxEvent), apps/worker/src/ (nenhum cleanup job)
- detalhe: Enum OutboxStatus tem PENDING, PROCESSED, FAILED. Eventos processados ficam na tabela para sempre. Nenhum cron job ou scheduled cleanup encontrado.

#### Impacto
- tecnico: Tabela cresce linearmente com uso. Queries de PENDING ficam lentas ao longo do tempo. Armazenamento desperdicado.
- negocio: Degradacao de performance de background jobs ao longo do tempo.

#### Recomendacao
- acao_sugerida: Criar cleanup job no worker que delete eventos PROCESSED com mais de 30 dias. Alternativa: mover para tabela de historico.
- prioridade: media

#### Observacoes
- none

---

### ACH-007
- titulo: Nenhum campo de version para optimistic locking em nenhum modelo
- severidade: medio
- categoria: concorrencia
- status: confirmado
- resumo: Nenhum dos 43 modelos possui campo version, updatedAt com check, ou mecanismo equivalente para optimistic locking. Todas as operacoes de update sao pessimistas (dependem apenas do Prisma where clause).

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (43 modelos, nenhum com campo version Int @default(0))
- detalhe: Busca por "version" no schema retorna zero resultados. updatedAt existe em alguns modelos mas nao e usado para concurrency control.

#### Impacto
- tecnico: Em cenarios de edicao concorrente (dois usuarios editando mesmo cliente), last-write-wins sem deteccao de conflito.
- negocio: Dados podem ser sobrescritos silenciosamente em edicao concorrente.

#### Recomendacao
- acao_sugerida: Adicionar campo version Int @default(0) aos modelos com risco de edicao concorrente (Client, Sale, Product, Stock). Verificar version no update.
- prioridade: media

#### Observacoes
- Prisma suporta optimistic locking via where clause com version field.

---

### ACH-008
- titulo: Sem estrategia de backup/restore nem data retention policy
- severidade: medio
- categoria: recuperacao e ciclo de vida
- status: confirmado
- resumo: Nao existe configuracao de backup automatico, documentacao de restore, nem politica de retencao de dados. OtpCodes expirados, cashbacks expirados e eventos processados acumulam indefinidamente.

#### Evidencia
- arquivo_ou_area: raiz do repositorio (nenhum script de backup), docker-compose.yml (volume sem backup), packages/db/ (sem cleanup jobs)
- detalhe: Busca por "backup", "restore", "retention", "cleanup" em todo o codebase retorna zero resultados relevantes.

#### Impacto
- tecnico: Perda de dados em caso de falha de disco/volume. Tabelas crescem sem controle.
- negocio: Risco de perda total de dados. Nao-conformidade com LGPD (dados sem politica de retencao).

#### Recomendacao
- acao_sugerida: Configurar pg_dump automatico diario (ou equivalente cloud). Documentar procedimento de restore. Criar jobs de cleanup para OtpCode (expirados), Cashback (expirados), OutboxEvent (processados).
- prioridade: media

#### Observacoes
- Se PostgreSQL for gerenciado (ex: RDS, Supabase), backup pode ser automatico. Mas nao ha evidencia disso no repositorio.

---

### ACH-009
- titulo: Migrations nao versionadas no git — apenas 1 script manual de RLS
- severidade: baixo
- categoria: evolucao de schema
- status: confirmado
- resumo: Diretorio de migrations contem apenas 1 arquivo manual (001_rls_policies.sql). Nao ha migrations Prisma geradas (prisma migrate dev) commitadas no repositorio. Historico de evolucao do schema nao e rastreavel.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/migrations/ (apenas manual/001_rls_policies.sql)
- detalhe: prisma migrate parece nao ter sido usado (ou migrations foram gitignored). Schema pode ter sido aplicado via prisma db push.

#### Impacto
- tecnico: Impossivel reconstruir banco a partir do zero usando migrations. Impossivel auditar mudancas de schema ao longo do tempo.
- negocio: Risco em deploy multi-ambiente — staging e producao podem ter schemas divergentes.

#### Recomendacao
- acao_sugerida: Adotar prisma migrate dev para gerar migrations versionadas. Commitar todas as migrations no git. Usar prisma migrate deploy em producao.
- prioridade: baixa

#### Observacoes
- prisma db push e aceitavel em desenvolvimento inicial, mas migrations sao necessarias para producao.

---

### ACH-010
- titulo: Modelagem e constraints de schema bem projetados — ponto forte
- severidade: informativo
- categoria: modelagem
- status: confirmado
- resumo: Schema com 43 modelos, 73 ocorrencias de tenantId, unique constraints compostos em tabelas criticas (Client phone, Tag name, FinancialReport period), Decimal(10,2) para valores financeiros, RLS implementado para 24 tabelas. Indexacao forte em tabelas hot (Client, Sale, ScheduledMessage, Appointment).

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (43 modelos, 27 indexes, 12 uniques), packages/db/prisma/migrations/manual/001_rls_policies.sql (24 tabelas com RLS)
- detalhe: Constraints @@unique([tenantId, phone]) para Client, @@unique([tenantId, name]) para Tag, @@unique([tenantId, period]) para FinancialReport previnem duplicacao de dados criticos.

#### Impacto
- tecnico: Integridade de dados protegida por constraints no nivel do banco. Modelagem alinhada aos padroes de acesso.
- negocio: Dados financeiros com precisao Decimal adequada. Multi-tenancy robusta no schema.

#### Recomendacao
- acao_sugerida: Manter padrao. Completar RLS para tabelas faltantes e adicionar unique constraint em Stock.
- prioridade: baixa

#### Observacoes
- none
