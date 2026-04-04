# Plano de Correção

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-03-26_00-30-00
- data_geracao: 2026-04-05 10:00:00
- total_achados: 8
- corrigiveis: 4
- corrigiveis_parciais: 2
- nao_corrigiveis: 1 (achado positivo)
- informativo_sem_acao: 1

## Ordem de Execução

### 1. ACH-007 — Web auth handler acessa Prisma diretamente
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/lib/auth.ts, apps/web/src/app/api/send-otp/route.ts, apps/web/src/app/api/register/route.ts
- acao_planejada: Refatorar auth.ts para usar TenantRepository ao invés de prisma direto. Ajustar route handlers para injetar repositórios via parâmetro.
- dependencias: nenhuma
- justificativa_ordem: Acoplamento em auth é ponto crítico. Corrigir primeiro para que outros refactors possam seguir o padrão.
- risco_da_correcao: Baixo — mudança de import, não de lógica.

### 2. ACH-001 — Telas mobile excessivamente grandes
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/mobile/src/screens/onboarding-screen.tsx (636 linhas)
- acao_planejada: Extrair cada step do onboarding para componente próprio. Separar StyleSheet em arquivo dedicado.
- dependencias: nenhuma
- justificativa_ordem: Maior arquivo do projeto (636 linhas). Reduz complexidade.
- risco_da_correcao: Médio — refactor de componente grande, possibilidade de quebra de UI.

### 3. ACH-005 — Magic numbers em analytics
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/analytics/use-cases/get-stats.ts
- acao_planejada: Criar constants.ts em analytics/domain/ e substituir magic numbers por constantes nomeadas.
- dependencias: nenhuma
- justificativa_ordem: Melhora legibilidade de regras de negócio (scoring, ABC).
- risco_da_correcao: Baixo — renomeação de valores, sem mudança de lógica.

### 4. ACH-006 — Conversão Decimal-to-Number repetida
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/sales/adapters/prisma-sale-repository.ts
- acao_planejada: Extrair função mapSaleFromPrisma() que centraliza conversão Decimal→Number.
- dependencias: nenhuma
- justificativa_ordem: Proximidade com ACH-005 (mesmo tipo de refactor).
- risco_da_correcao: Baixo — extração de função, mesma lógica.

### 5. ACH-004 — Duplicação no WhatsApp adapter
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- acao_planejada: Extrair método privado sendWhatsAppMessage() que centraliza fetch, headers e error handling.
- dependencias: nenhuma
- justificativa_ordem: Refactor pontual em arquivo isolado.
- risco_da_correcao: Baixo — extração de método, sem mudança de comportamento.

### 6. ACH-002 — Duplicação em 22 repositórios Prisma
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/business/*/adapters/prisma-*-repository.ts (22 arquivos)
- acao_planejada: Criar helper de paginação e filter-building reutilizável. Aplicar em repositórios existentes.
- dependencias: nenhuma
- justificativa_ordem: Impacta muitos arquivos — fica por último entre os corrigíveis para minimizar conflitos.
- risco_da_correcao: Médio — mudança estrutural em 22 arquivos. Validação humana recomendada.

### 7. ACH-003 — Duplicação em 16 tRPC routers CRUD
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/api/src/routers/*.ts (16 arquivos)
- acao_planejada: Criar factory function createCRUDRouter() para procedures padrão.
- dependencias: ACH-002 (routers instanciam repositórios)
- justificativa_ordem: Depende do padrão de repositórios (ACH-002). Fica por último.
- risco_da_correcao: Alto — mudança estrutural em todos os routers. Validação humana crítica.

## Achados Não Corrigíveis

### ACH-008 — Convenções de código e tipagem excelentes
- motivo: Achado positivo — ponto forte do projeto, não requer ação corretiva.
- acao_recomendada_ao_usuario: Manter as convenções atuais.

## Resumo do Plano
- Total a corrigir: 5
- Total parcial (requer validação humana após correção): 2
- Total não corrigível (achado positivo): 1
- Estimativa de commits: 7
