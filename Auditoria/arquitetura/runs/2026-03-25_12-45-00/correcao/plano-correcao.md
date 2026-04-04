# Plano de Correção

## Identificação
- dominio: arquitetura
- run_id: 2026-03-25_12-45-00
- data_geracao: 2026-04-04 22:30:00
- total_achados: 9
- corrigiveis: 4
- corrigiveis_parciais: 3
- nao_corrigiveis: 2

## Ordem de Execução

### 1. ACH-009 — Import direto de Prisma em router de messaging
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/messaging.ts
- acao_planejada: Mover consulta direta prisma.client.findFirst para use-case com repositorio injetado.
- dependencias: nenhuma
- justificativa_ordem: Correção pontual simples, resolve antes de refactoring maior
- risco_da_correcao: Baixo

### 2. ACH-003 — Event handlers definidos mas nunca registrados
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/index.ts ou apps/worker/src/index.ts
- acao_planejada: Importar e chamar registerInventoryEventHandlers, registerPostSaleEventHandler e registerNotificationEventHandlers no bootstrap do worker.
- dependencias: nenhuma
- justificativa_ordem: Alto, correção simples e direta
- risco_da_correcao: Baixo — apenas registra handlers que já existem

### 3. ACH-008 — Redis SPOF sem fallback
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/lib/redis.ts, apps/api/src/lib/cache.ts
- acao_planejada: Melhorar retry strategy com exponential backoff. Adicionar graceful degradation no cache (bypass sem cache se Redis indisponível).
- dependencias: nenhuma
- justificativa_ordem: Medio, independente, infraestrutura
- risco_da_correcao: Baixo — melhora resiliência sem alterar comportamento normal

### 4. ACH-001 — Violação hexagonal em 15 use-cases com import direto de Prisma
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: 15 use-cases em packages/business/
- acao_planejada: Para cada use-case afetado: criar port (interface de repositório), criar adapter Prisma, refatorar use-case para receber repositório injetado, atualizar router para instanciar e injetar o adapter.
- dependencias: nenhuma
- justificativa_ordem: Alto, maior volume de trabalho, padrão já existe em modules maduros (clients, sales)
- risco_da_correcao: Medio — refactoring em 15 arquivos com alterações em routers correspondentes

### 5. ACH-002 — Maturidade hexagonal inconsistente
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/business/ (multiplos modulos)
- acao_planejada: Será majoritariamente resolvido pela execução do ACH-001. Verificar e documentar quais módulos ainda ficam com gaps após ACH-001.
- dependencias: ACH-001
- justificativa_ordem: Medio, dependente de ACH-001, verificação pós-correção
- risco_da_correcao: Nenhum

### 6. ACH-004 — BullMQ queues sem processors integrados
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/worker/src/processors/, apps/worker/src/index.ts
- acao_planejada: Criar processor skeleton para cada fila (messaging, campaigns, schedule, analytics, outbox). Registrar no worker bootstrap. Integrar submissão de jobs nos pontos óbvios (confirmSale → outbox, createCampaign → campaigns queue).
- dependencias: ACH-003 (handlers devem estar registrados)
- justificativa_ordem: Alto, parcial — skeletons e integração básica, lógica completa depende de Fases futuras
- risco_da_correcao: Medio — integrar jobs em use-cases pode ter efeitos colaterais

### 7. ACH-005 — 3 documentos de referência citados não existem
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: CLAUDE.md, begin/
- acao_planejada: Corrigir referências no CLAUDE.md para apontar para documentos existentes ou remover referências a documentos inexistentes.
- dependencias: nenhuma
- justificativa_ordem: Medio, documentação
- risco_da_correcao: Nenhum

### 8. ACH-006 — Ausência de ADRs
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docs/adr/
- acao_planejada: Criar diretório docs/adr/ e registrar ADRs iniciais para decisões arquiteturais visíveis no código (hexagonal, multi-tenant, outbox, BullMQ, Auth.js OTP).
- dependencias: nenhuma
- justificativa_ordem: Medio, documentação
- risco_da_correcao: Nenhum

## Achados Não Corrigíveis

### ACH-007 — Ausência de configuração de deploy para produção
- motivo: Requer decisões de infraestrutura (PaaS, cloud provider, estratégia de deploy) que são decisões de negócio. O agente pode criar Dockerfiles mas a estratégia de deploy depende de decisão do usuário.
- acao_recomendada_ao_usuario: Definir estratégia de deploy (Vercel, Railway, AWS ECS, K8s) e criar Dockerfiles + CI/CD correspondentes.

## Resumo do Plano
- Total a corrigir: 5
- Total parcial (requer validação humana após correção): 3
- Total não corrigível (ação humana necessária): 1
- Estimativa de commits: ~20+
