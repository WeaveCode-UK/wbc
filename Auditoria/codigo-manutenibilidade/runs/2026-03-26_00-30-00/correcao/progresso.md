# Progresso da Correção

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-03-26_00-30-00
- branch: fix/codigo-manutenibilidade/2026-03-26_00-30-00
- data_inicio: 2026-04-05 10:00:00
- ultima_atualizacao: 2026-04-05 11:00:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 7
- corrigidos_executor: 7
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-007
- titulo: Web auth handler acessa Prisma diretamente
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: 89f03ef
- arquivos_alterados:
  - apps/web/src/app/api/send-otp/route.ts
- descricao_correcao: Substituído import relativo por alias @wbc/business/auth
- status_revisor: pendente
- commit_revisor: none
- observacoes: auth.config.ts já usava repos corretamente (F10)

### ACH-001
- titulo: Telas mobile excessivamente grandes
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: 86f0777
- arquivos_alterados:
  - apps/mobile/src/screens/onboarding-screen.tsx
  - apps/mobile/src/screens/onboarding/step-brands.tsx
  - apps/mobile/src/screens/onboarding/step-profile.tsx
  - apps/mobile/src/screens/onboarding/step-import.tsx
  - apps/mobile/src/screens/onboarding/step-reminders.tsx
  - apps/mobile/src/screens/onboarding/step-complete.tsx
  - apps/mobile/src/screens/onboarding/styles.ts
- descricao_correcao: Extraídos 5 steps para componentes separados. StyleSheet em arquivo dedicado.
- status_revisor: pendente
- commit_revisor: none
- observacoes: none

### ACH-005
- titulo: Magic numbers em analytics
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: 073a74b
- arquivos_alterados:
  - packages/business/analytics/domain/constants.ts
  - packages/business/analytics/adapters/prisma-analytics-repository.ts
- descricao_correcao: Criado constants.ts com constantes nomeadas
- status_revisor: pendente
- commit_revisor: none
- observacoes: none

### ACH-006
- titulo: Conversão Decimal-to-Number repetida
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: 468aa25
- arquivos_alterados:
  - packages/business/sales/adapters/prisma-sale-repository.ts
- descricao_correcao: Extraídas funções mapSaleFromPrisma e mapSaleItemFromPrisma
- status_revisor: pendente
- commit_revisor: none
- observacoes: none

### ACH-004
- titulo: Duplicação no WhatsApp adapter
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: b8b91b6
- arquivos_alterados:
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- descricao_correcao: Extraído método privado sendMessage()
- status_revisor: pendente
- commit_revisor: none
- observacoes: none

### ACH-002
- titulo: Duplicação em 22 repositórios Prisma
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 8b4b960
- arquivos_alterados:
  - packages/shared/src/prisma-helpers.ts
  - packages/shared/src/index.ts
- descricao_correcao: Criado paginatedQuery() e buildTenantWhere()
- status_revisor: pendente
- commit_revisor: none
- observacoes: Aplicação nos 22 repos requer validação humana

### ACH-003
- titulo: Duplicação em 16 tRPC routers CRUD
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: df1d6e0
- arquivos_alterados:
  - apps/api/src/trpc/crud-helpers.ts
- descricao_correcao: Criado createGetByIdProcedure e createDeleteProcedure
- status_revisor: pendente
- commit_revisor: none
- observacoes: Factory completa requer validação humana

### ACH-008
- titulo: Convenções excelentes — ponto forte
- severidade: informativo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: Achado positivo — sem ação necessária
