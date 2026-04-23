# Plano de Correção

## Identificação
- dominio: ui-ux-fluxos
- run_id: 2026-04-19_08-47-24
- data_geracao: 2026-04-23 00:00:00
- total_achados: 25
- corrigiveis: 20
- corrigiveis_parciais: 4
- nao_corrigiveis: 1

## Ordem de Execução

Agrupamento por proximidade de arquivo/área para evitar conflitos. Shared components primeiro, depois layout/nav, auth/onboarding, listings e por fim settings/dark/mobile.

### 1. ACH-011 — Forms sem aria-live em erros
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/components/form-field.tsx; packages/ui/src/components/input.tsx
- acao_planejada: adicionar container de erro com aria-live="polite" e aria-atomic="true" no FormField
- dependencias: nenhuma
- justificativa_ordem: base para outros achados do onboarding
- risco_da_correcao: baixo (apenas atributos ARIA)

### 2. ACH-015 — Inputs de senha sem toggle de visibilidade
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/ui/src/components/input.tsx; apps/web/src/components/auth/credentials-form.tsx
- acao_planejada: adicionar prop `showPasswordToggle` em Input quando type="password"; ícone olho + aria-pressed
- dependencias: nenhuma
- justificativa_ordem: shared component antes de auth flows
- risco_da_correcao: baixo

### 3. ACH-013 — ConfirmModal sem focus trap e autoFocus
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/ui/src/components/confirm-modal.tsx
- acao_planejada: adicionar autoFocus no botão confirm e event listeners para tab cycling dentro do dialog
- dependencias: nenhuma
- justificativa_ordem: shared component antes de uso em callers
- risco_da_correcao: baixo

### 4. ACH-018 — ConfirmModal sem isLoading
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/ui/src/components/confirm-modal.tsx
- acao_planejada: adicionar prop `isLoading`, desabilitar botões e mostrar spinner quando true; aria-busy
- dependencias: ACH-013 (mesmo arquivo)
- justificativa_ordem: encadear com ACH-013 para evitar conflito
- risco_da_correcao: baixo

### 5. ACH-010 — Contraste marginal em text-tertiary
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/src/theme (tokens de tema)
- acao_planejada: ajustar token `text-tertiary` de #6B7280 para #5A6370 (AAA) nos temas default/rose light
- dependencias: nenhuma
- justificativa_ordem: token antes dos callers do dashboard
- risco_da_correcao: baixo (ajuste de cor)

### 6. ACH-002 — Dashboard desktop-first sem reflow <md
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/page.tsx; apps/web/src/app/(dashboard)/layout.tsx
- acao_planejada: adicionar breakpoint `sm:` nas grids, padding/fonte adaptados; sidebar permanece hidden md:flex; hamburger será wired em ACH-001
- dependencias: nenhuma
- justificativa_ordem: layout antes de nav
- risco_da_correcao: baixo

### 7. ACH-001 — Mobile bottom-nav sem acesso a 5 rotas
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/components/bottom-nav.tsx; apps/web/src/components/mobile-menu.tsx (novo)
- acao_planejada: substituir slot "+" central por menu "Mais" que abre sheet com as 5 rotas restantes (Campaigns, Finance, Inventory, Team, Settings)
- dependencias: nenhuma
- justificativa_ordem: depois de layout
- risco_da_correcao: medio (mudança visível em mobile)

### 8. ACH-009 — Hierarquia h1/h2/h3 no dashboard
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/page.tsx
- acao_planejada: manter h1 único para saudação; h2 para seções principais; h3 para subsecções
- dependencias: ACH-002 (mesma página)
- justificativa_ordem: próximo em sequência
- risco_da_correcao: baixo (apenas tags)

### 9. ACH-008 — aria-label ausente em botões com ícone/emoji
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/page.tsx; apps/web/src/components/bottom-nav.tsx
- acao_planejada: aria-label baseado em t('action_...') em quick actions e FAB; emojis com role="img" aria-hidden
- dependencias: ACH-001 e ACH-002 (mesmo arquivo)
- justificativa_ordem: após reescrita da bottom-nav
- risco_da_correcao: baixo

### 10. ACH-021 — type="button" explícito
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/page.tsx; apps/web/src/components/bottom-nav.tsx
- acao_planejada: adicionar type="button" em todos os <button> não-submit
- dependencias: ACH-008 (mesmo arquivo)
- justificativa_ordem: encadear com ACH-008
- risco_da_correcao: baixo

### 11. ACH-022 — Feedback hover/active pouco expressivo
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/page.tsx
- acao_planejada: adicionar active:scale-[.98] + transition nos quick actions
- dependencias: ACH-021 (mesmo arquivo)
- justificativa_ordem: encadear com mesmos callers
- risco_da_correcao: baixo

### 12. ACH-003 — onClick vazios no dashboard e mobile
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/page.tsx; apps/mobile/src/screens/new-sale-screen.tsx
- acao_planejada: wire-up de handlers com navigation (useRouter/push) e toast sonner para ações; marcar como tarefa futura mutations reais
- dependencias: ACH-022 (mesmo arquivo web)
- justificativa_ordem: encadear com callers do dashboard
- risco_da_correcao: baixo (navegação)

### 13. ACH-016 — Onboarding desktop sem StepIndicator
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(auth)/onboarding/page.tsx
- acao_planejada: substituir texto "Step X of Y" por <StepIndicator /> do packages/ui
- dependencias: nenhuma
- justificativa_ordem: inicia bloco auth/onboarding
- risco_da_correcao: baixo

### 14. ACH-024 — Labels htmlFor com id dinâmico
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(auth)/onboarding/page.tsx
- acao_planejada: usar useId() do React para gerar id estável; passar manualmente para Label+Input
- dependencias: ACH-016 (mesmo arquivo)
- justificativa_ordem: encadear
- risco_da_correcao: baixo

### 15. ACH-012 — Máscaras de entrada BR
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(auth)/onboarding/page.tsx; apps/web/src/lib/masks.ts (novo)
- acao_planejada: adicionar helpers `maskPhone`, `maskCPF`, `maskCNPJ` em lib/masks.ts; aplicar em onChange dos inputs
- dependencias: ACH-024 (mesmo arquivo)
- justificativa_ordem: encadear
- risco_da_correcao: baixo

### 16. ACH-014 — Reset-password/Magic-link sem AlertDialog
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(auth)/login/page.tsx; apps/web/src/app/(auth)/register/page.tsx
- acao_planejada: envolver ações com ConfirmModal (já existente) explicando "vamos enviar link"
- dependencias: ACH-018 (usa ConfirmModal com isLoading)
- justificativa_ordem: após corrigir ConfirmModal
- risco_da_correcao: baixo

### 17. ACH-005 — i18n parcial (corrigivel_parcial)
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/web/src/messages/{pt,en}.json; eslint rule; mensagens Zod
- acao_planejada: seed de estrutura — adicionar chaves ausentes principais (empty states, loading, validações), helper `zodI18n.ts` p/ mensagens localizadas, eslint-rule placeholder; follow-up doc listando o restante
- dependencias: nenhuma
- justificativa_ordem: bloco de listings; parcial
- risco_da_correcao: baixo (adição)

### 18. ACH-006 — Loading skeletons em listas
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/ui/src/components/list-skeleton.tsx (novo); apps/web/src/app/(dashboard)/clients/page.tsx; sales/page.tsx
- acao_planejada: criar helper `<ListSkeleton count={N} />` com animate-pulse; usar em Suspense ou estados locais
- dependencias: nenhuma
- justificativa_ordem: após i18n para poder i18nar textos
- risco_da_correcao: baixo

### 19. ACH-007 — EmptyState nas listagens
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/clients/page.tsx; sales/page.tsx; packages/ui/src/components/empty-state.tsx
- acao_planejada: substituir divs simples por EmptyState com icon + title + action (CTA "Adicionar primeiro")
- dependencias: ACH-006 (mesmos arquivos)
- justificativa_ordem: encadear com skeletons
- risco_da_correcao: baixo

### 20. ACH-017 — Settings stub (corrigivel_parcial)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/web/src/app/(dashboard)/settings/page.tsx; apps/web/src/app/(dashboard)/settings/profile/page.tsx (seed)
- acao_planejada: seed de tabs (Profile/Plan/Landing/Data Export) com rotas stub e form base profile (react-hook-form + Zod); follow-up doc listando cada tab
- dependencias: nenhuma
- justificativa_ordem: feature grande isolada
- risco_da_correcao: baixo (adição)

### 21. ACH-019 — Dark themes não persistem (corrigivel_parcial)
- severidade: baixo
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/web/src/providers/theme-provider.tsx; middleware ou cookie
- acao_planejada: adicionar localStorage.setItem no toggle de mode; hidratar do cookie em SSR (helper `getServerTheme`); follow-up para unificação com mobile
- dependencias: nenhuma
- justificativa_ordem: bloco final
- risco_da_correcao: baixo

### 22. ACH-020 — Typography mobile sem tokens (corrigivel_parcial)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/ui-native/src/typography.ts (novo); apps/mobile/src/screens/new-sale-screen.tsx
- acao_planejada: seed de `packages/ui-native/src/typography.ts` com tokens heading1..caption e helper `textStyle(theme, 'heading1')`; migrar NewSaleScreen como exemplo; follow-up doc p/ outras telas
- dependencias: nenhuma
- justificativa_ordem: mobile
- risco_da_correcao: baixo

### 23. ACH-004 — Touch targets <44×44 mobile
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/mobile/src/screens/new-sale-screen.tsx
- acao_planejada: minHeight/minWidth 44 no back button e itens de grid; hit slop quando necessário
- dependencias: ACH-020 (mesmo arquivo mobile)
- justificativa_ordem: encadear com typography mobile
- risco_da_correcao: baixo

### 24. ACH-023 — VIP desconto sem feedback
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/mobile/src/screens/new-sale-screen.tsx
- acao_planejada: destaque visual no total ("VIP -5%") quando cliente VIP
- dependencias: ACH-004 (mesmo arquivo)
- justificativa_ordem: encadear mobile
- risco_da_correcao: baixo

## Achados Não Corrigíveis

### ACH-025 — Upload hipotético
- motivo: Feature de upload não existe no código — achado é hipótese de auditoria. Não há código concreto para corrigir.
- acao_recomendada_ao_usuario: Quando feature de upload for introduzida, implementar validações (max 5 MB; image/*) e mensagens inline no mesmo PR. Registrar em follow-up de UX.

## Resumo do Plano
- Total a corrigir: 20
- Total parcial (requer validação humana após correção): 4
- Total não corrigível (ação humana necessária): 1
- Estimativa de commits: 24 (executor) + possíveis review-fix
