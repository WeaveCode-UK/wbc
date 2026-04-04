# Achados da Auditoria

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-03-26_00-30-00
- ultima_atualizacao: 2026-03-26 01:00:00

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese com justificativa.

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
- titulo: Telas mobile excessivamente grandes com responsabilidades misturadas
- severidade: medio
- categoria: complexidade e legibilidade
- status: confirmado
- resumo: 6 telas mobile excedem 250 linhas. onboarding-screen.tsx tem 636 linhas com switch de 5 cases (320+ linhas) e StyleSheet inline (218+ linhas). Logica de renderizacao, estilo e estado estao misturados em componentes monoliticos.

#### Evidencia
- arquivo_ou_area: apps/mobile/src/screens/onboarding-screen.tsx (636 linhas), client-profile-screen.tsx (291), new-sale-screen.tsx (277), finance-screen.tsx (261), schedule-screen.tsx (260), campaigns-screen.tsx (221)
- detalhe: Cada tela contem JSX, logica de estado, StyleSheet.create e theme hooks num unico arquivo. onboarding possui renderStep() com switch de 5 cases onde cada case tem 100+ linhas de JSX.

#### Impacto
- tecnico: Dificulta leitura, navegacao e modificacao. Mudanca em um step do onboarding exige navegar 636 linhas. StyleSheet misturado com logica impede reuso de estilos.
- negocio: Custo de manutencao mobile cresce com cada nova tela seguindo esse padrao.

#### Recomendacao
- acao_sugerida: Extrair cada step do onboarding para componente proprio. Separar StyleSheet em arquivo dedicado. Criar componentes de layout reutilizaveis para o padrao card+theme usado em todas as telas.
- prioridade: media

#### Observacoes
- Todas as 9 telas mobile compartilham mesmo padrao de duplicacao (useTheme + ScrollView + cards + StyleSheet inline).

---

### ACH-002
- titulo: Duplicacao estrutural em 22 repositorios Prisma com padrao identico de filter-building
- severidade: medio
- categoria: duplicacao
- status: confirmado
- resumo: Todos os 22 arquivos prisma-*-repository.ts repetem padrao identico de construcao de where clause com tenantId, filtros condicionais, findMany + count. Nao existe base class nem helper compartilhado.

#### Evidencia
- arquivo_ou_area: packages/business/*/adapters/prisma-*-repository.ts (22 arquivos)
- detalhe: Cada repositorio constroi manualmente o objeto where com tenantId e filtros opcionais, depois executa Promise.all([findMany, count]) com skip/take. Padrao repetido em clients, sales, catalog, inventory, finance, etc.

#### Impacto
- tecnico: ~300 linhas duplicadas. Mudanca no padrao de paginacao ou filtragem exige alterar 22 arquivos. Risco de inconsistencia entre repositorios.
- negocio: Cada novo modulo replica o mesmo boilerplate, aumentando custo de desenvolvimento.

#### Recomendacao
- acao_sugerida: Criar classe base generica PrismaRepository<T, F> com buildWhere(), list() e count() abstratos, ou ao menos um helper de filter-building reutilizavel.
- prioridade: media

#### Observacoes
- none

---

### ACH-003
- titulo: Duplicacao estrutural em 16 tRPC routers com CRUD quase identico
- severidade: medio
- categoria: duplicacao
- status: confirmado
- resumo: Os 16 routers em apps/api/src/routers/ seguem padrao ~95% identico: instanciar repositorios no topo, criar procedures list/getById/create/update/delete com mesmo shape de input validation, ctx.tenant.tenantId extraction e delegacao para use-case.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts (132 linhas), sales.ts (95), catalog.ts (93), inventory.ts (83), finance.ts (73) e mais 11 routers
- detalhe: Cada router declara const repo = new PrismaXRepository() no topo e depois cria procedures protectedProcedure.input(z.object({...})).query/mutation com identica estrutura de delegacao.

#### Impacto
- tecnico: ~600 linhas de boilerplate CRUD repetido. Risco de divergencia de convencoes entre routers. Mudanca no padrao de autorizacao exige alterar todos os 16 arquivos.
- negocio: Custo de adicionar novo modulo inclui copiar e adaptar router existente.

#### Recomendacao
- acao_sugerida: Criar factory function createCRUDRouter() que gere os procedures padroes (list, getById, create, update, delete) a partir de schemas e use-cases, permitindo routers customizados para procedures especificas do dominio.
- prioridade: media

#### Observacoes
- none

---

### ACH-004
- titulo: Duplicacao de metodos no WhatsApp adapter com 95% de codigo identico
- severidade: baixo
- categoria: duplicacao
- status: confirmado
- resumo: WhatsAppN2Adapter possui 3 metodos (sendText, sendImage, sendAudio) com try-catch + fetch + response handling praticamente identicos, diferenciando apenas o payload body.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts (101 linhas)
- detalhe: Cada metodo faz fetch para mesma URL com mesmos headers, mesmo tratamento de erro e mesmo formato de retorno. Apenas o body JSON difere.

#### Impacto
- tecnico: ~40 linhas duplicadas. Mudanca na logica de envio (headers, error handling, retry) exige alterar 3 metodos.
- negocio: Impacto minimo, confinado a um unico arquivo.

#### Recomendacao
- acao_sugerida: Extrair metodo privado sendWhatsAppMessage(type, phone, payload) que centraliza fetch, headers e error handling.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-005
- titulo: Magic numbers em analytics use-cases sem constantes nomeadas
- severidade: baixo
- categoria: legibilidade
- status: confirmado
- resumo: analytics/use-cases/get-stats.ts contem valores magicos para engagement score (100, 10, 30, 15), percentis ABC (0.2, 0.5) e calculos de tempo (1000*60*60*24) sem constantes nomeadas ou documentacao.

#### Evidencia
- arquivo_ou_area: packages/business/analytics/use-cases/get-stats.ts (linhas ~53, ~89, ~50)
- detalhe: score = Math.min(100, salesCount * 10 + ...), percentile <= 0.2 ? 'A', Math.floor(.../ (1000 * 60 * 60 * 24)). Valores nao possuem nomes semanticos.

#### Impacto
- tecnico: Dificuldade de entender a logica de scoring sem contexto. Risco de alterar valores errados durante manutencao.
- negocio: Regras de negocio (classificacao ABC, engagement) ficam ocultas em numeros magicos.

#### Recomendacao
- acao_sugerida: Criar packages/business/analytics/domain/constants.ts com ENGAGEMENT_SCORE_MAX, ABC_PERCENTILE_A, ABC_PERCENTILE_B, MS_PER_DAY e equivalentes.
- prioridade: baixa

#### Observacoes
- Outros modulos (sales, messaging) ja usam constantes nomeadas corretamente (CASHBACK_PERCENTAGE, POST_SALE_STAGES).

---

### ACH-006
- titulo: Conversao Decimal-to-Number repetida no sale repository sem helper
- severidade: baixo
- categoria: duplicacao
- status: confirmado
- resumo: prisma-sale-repository.ts repete a mesma logica de conversao Number(sale.discount), Number(sale.total), etc. em 4 metodos diferentes (getById, list, create, updateStatus).

#### Evidencia
- arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts (linhas ~14-23, ~37, ~67, ~75)
- detalhe: Bloco identico de mapeamento {...sale, discount: Number(sale.discount), total: Number(sale.total), cashbackUsed: Number(...), items: sale.items.map(i => ({...i, unitPrice: Number(i.unitPrice), subtotal: Number(i.subtotal)}))} repetido 4 vezes.

#### Impacto
- tecnico: Se um campo Decimal novo for adicionado ao Sale, 4 pontos precisam ser atualizados. Risco de conversao parcial.
- negocio: Impacto minimo, confinado a um unico repositorio.

#### Recomendacao
- acao_sugerida: Extrair funcao privada mapSaleFromPrisma(sale) que centraliza a conversao Decimal→Number.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-007
- titulo: Web auth handler acessa Prisma diretamente bypassing repositorios
- severidade: medio
- categoria: acoplamento
- status: confirmado
- resumo: apps/web/src/lib/auth.ts e route handlers (send-otp, register) fazem chamadas diretas a prisma.tenant.findUnique e instanciam repositorios localmente, aumentando acoplamento e dificultando modificacao.

#### Evidencia
- arquivo_ou_area: apps/web/src/lib/auth.ts (prisma.tenant.findUnique direto), apps/web/src/app/api/send-otp/route.ts, apps/web/src/app/api/register/route.ts
- detalhe: Auth callback faz 2 chamadas diretas a prisma.tenant sem passar por repository port. Route handlers instanciam PrismaOtpRepository e PrismaTenantRepository localmente.

#### Impacto
- tecnico: Mudanca na logica de tenant resolution exige alterar auth.ts diretamente. Nao pode ser testado com mock repository facilmente.
- negocio: Risco moderado — auth e ponto critico do sistema.

#### Recomendacao
- acao_sugerida: Injetar TenantRepository no auth callback e mover chamadas Prisma para o repositorio existente.
- prioridade: media

#### Observacoes
- Problema afeta tambem o dominio de arquitetura (ja registrado na run anterior). Aqui o angulo e de modificabilidade e testabilidade do codigo de auth.

---

### ACH-008
- titulo: Convencoes de codigo e tipagem excelentes — ponto forte do projeto
- severidade: informativo
- categoria: convencoes e legibilidade
- status: confirmado
- resumo: O projeto apresenta convencoes de nomenclatura consistentes (kebab-case para arquivos, camelCase para funcoes, PascalCase para tipos), zero uso de `any`, zero TODO/FIXME, TypeScript strict mode com noUncheckedIndexedAccess, ESLint e Prettier enforced. Barrel exports limpos em todos os 15 modulos.

#### Evidencia
- arquivo_ou_area: packages/config/tsconfig.base.json (strict: true, noUncheckedIndexedAccess: true), packages/config/eslint.base.mjs (no-explicit-any: error), packages/config/prettier.config.mjs, packages/business/*/index.ts (15 barrel files)
- detalhe: Grep por `: any` e `as any` retorna zero resultados em codigo proprio. Grep por TODO/FIXME/HACK retorna zero. Naming conventions verificadas em 229 arquivos TypeScript.

#### Impacto
- tecnico: Fundacao solida para evolucao. Novos desenvolvedores encontram padroes previsiveis.
- negocio: Reduz custo de onboarding e manutencao.

#### Recomendacao
- acao_sugerida: Manter as convencoes atuais. Considerar documentar o pattern library formalmente.
- prioridade: baixa

#### Observacoes
- none
