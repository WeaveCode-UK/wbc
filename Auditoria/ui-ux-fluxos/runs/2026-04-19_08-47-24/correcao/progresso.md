# Progresso da Correção

## Identificação
- dominio: ui-ux-fluxos
- run_id: 2026-04-19_08-47-24
- branch: fix/ui-ux-fluxos/2026-04-19_08-47-24
- data_inicio: 2026-04-23 00:00:00
- ultima_atualizacao: 2026-04-23 01:30:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 24
- corrigidos_executor: 24
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-011
- titulo: Forms sem aria-live em erros
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 445d480
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/input.tsx
- descricao_correcao: container de erro envolvido por div com aria-live="polite" e aria-atomic="true"; role="alert" removido (polite menos intrusivo que assertive implícito)
- observacoes: none

### ACH-015
- titulo: Inputs de senha sem toggle de visibilidade
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 66ebe12
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/input.tsx
  - apps/web/src/components/form-field.tsx
  - apps/web/src/components/auth/credentials-form.tsx
- descricao_correcao: prop togglePassword em Input; botão com aria-pressed+aria-controls; CredentialsForm ativa em password/confirmPassword
- observacoes: none

### ACH-013
- titulo: ConfirmModal sem focus trap e autoFocus
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 1bc3567
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/confirm-modal.tsx
- descricao_correcao: autoFocus em confirm; handleKeyDown trava Tab/Shift+Tab entre confirm/cancel; aria-describedby
- observacoes: none

### ACH-018
- titulo: ConfirmModal sem isLoading
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ddd0ccb
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/confirm-modal.tsx
- descricao_correcao: prop isLoading + aria-busy; botões disabled; spinner no confirm; cancel desabilitado durante loading
- observacoes: none

### ACH-010
- titulo: Contraste marginal em text-tertiary
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: cc74f77
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/theme/colors.ts
- descricao_correcao: textTertiary light vira #5A5261 (era md3.outline #7D7387 ≈ 4.2:1); classification C texto vira #4B5563 (era #6B7280)
- observacoes: dark mode já era AAA, mantido

### ACH-002
- titulo: Dashboard desktop-first sem reflow <md
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ad878f8
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: breakpoint sm:; grid-cols-1 em <sm; fontes/heading escalam sm:→md:; padding 3/6
- observacoes: none

### ACH-001
- titulo: Mobile bottom-nav sem acesso a 5 rotas
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 379f892
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/components/bottom-nav.tsx
  - packages/i18n/src/locales/{pt-BR,en}/common.json
- descricao_correcao: botão "More" central abre menu com Campaigns/Finance/Inventory/Team/Settings; ESC fecha; aria-haspopup; chave nav_more em pt/en
- observacoes: none

### ACH-009
- titulo: Hierarquia h1/h2/h3 no dashboard
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: a61f049
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: h1 agora é identidade da página (nav_my_day); greeting e summary viram <p>
- observacoes: none

### ACH-008
- titulo: aria-label ausente em botões com ícone/emoji
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: e050e85
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: aria-label explícito em quick actions; aria-hidden nos spans de emoji; birthday_today com span aria-hidden
- observacoes: bottom-nav já recebeu aria-label em ACH-001

### ACH-021
- titulo: type="button" explícito
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 2118746
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
  - apps/web/src/app/(dashboard)/layout.tsx
- descricao_correcao: type="button" em todos os botões não-submit do dashboard e toggles de tema
- observacoes: none

### ACH-022
- titulo: Feedback hover/active pouco expressivo
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7ab1fe7
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: active:scale-[0.98], active:opacity-90, focus:ring; transition-all duration-150
- observacoes: none

### ACH-003
- titulo: onClick vazios no dashboard e mobile
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b265945
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
  - apps/mobile/src/screens/new-sale-screen.tsx
- descricao_correcao: quick actions web → router.push; Today section → /finance, /inventory, /campaigns; mobile NewSaleScreen recebe props onBack/onSaveDraft/onConfirmSale com fallback Alert
- observacoes: mutations reais + toast lib (sonner) ficam como follow-up (não há toast lib instalada no projeto)

### ACH-016
- titulo: Onboarding desktop sem StepIndicator
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 58ede7c
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(auth)/onboarding/page.tsx
- descricao_correcao: StepIndicator (0-indexed) aparece entre h1 e texto step; texto mantém (current de total) para redundância semântica
- observacoes: none

### ACH-024
- titulo: Labels htmlFor com id dinâmico
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 05757e9
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(auth)/onboarding/page.tsx
- descricao_correcao: useId() para nameId/slugId/phoneId; htmlFor e id explícitos; aria-describedby no hint do slug
- observacoes: none

### ACH-012
- titulo: Máscaras de entrada BR
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: eb2e2f5
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/lib/masks.ts (novo)
  - apps/web/src/app/(auth)/onboarding/page.tsx
- descricao_correcao: maskPhoneBR/maskCPF/maskCNPJ + onlyDigits/phoneDigits; aplicado em phone do onboarding (submit envia só dígitos)
- observacoes: CPF/CNPJ helpers disponíveis para usos futuros

### ACH-014
- titulo: Reset-password/Magic-link sem AlertDialog
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 041f974
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(auth)/reset-password/page.tsx
  - packages/i18n/src/locales/{pt-BR,en}/auth.json
- descricao_correcao: submit agora abre ConfirmModal com email; cancel/confirmar; isLoading; 3 novas chaves i18n resetPassword.confirmTitle/Description/Send
- observacoes: Links "Esqueci senha"/"Criar conta" navegam sem confirmar (propositadamente); confirmação fica no submit do form de destino

### ACH-005
- titulo: i18n parcial — validações e empty states hardcoded em pt
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 8ac5dbd
- commit_revisor: none
- arquivos_alterados:
  - packages/i18n/src/locales/{pt-BR,en}/errors.json (seed validation.*)
  - apps/web/src/lib/zod-i18n.ts (novo)
  - docs/UI-I18N-FOLLOWUP.md (novo)
- descricao_correcao: seed de errors.validation (required/invalid_email/too_small/too_big/regex_mismatch/phone_br/cpf/cnpj...); helper zodI18nErrorMap + installZodI18n(t); follow-up doc com 5 itens pendentes
- observacoes: validação humana — instalar error-map em cada layout cliente; sweep de strings hardcoded remanescentes

### ACH-006
- titulo: Loading skeletons em listas
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7bfd598
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/list-skeleton.tsx (novo)
  - packages/ui/src/index.ts
- descricao_correcao: helper <ListSkeleton count=N variant='list'|'card'>; role=status aria-live aria-busy sr-only Loading
- observacoes: adoção nas listas ficará para quando houver data-fetching real

### ACH-007
- titulo: EmptyState nas listagens
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d5ff52a
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/clients/page.tsx
  - apps/web/src/app/(dashboard)/sales/page.tsx
- descricao_correcao: divs simples substituídas por <EmptyState> com ícone emoji, título, descrição e CTA Button
- observacoes: none

### ACH-017
- titulo: Settings stub sem formulários
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b84ffed
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/settings/page.tsx (tabbed)
  - apps/web/src/app/(dashboard)/settings/_components/profile-settings-form.tsx (novo)
  - docs/UI-SETTINGS-FOLLOWUP.md (novo)
- descricao_correcao: Settings virou tabbed (Profile/Plan/Landing/Export) com roles ARIA; Profile tem form react-hook-form + Zod com submit stubbado; Plan/Landing/Export ainda são placeholders rastreados em follow-up
- observacoes: validação humana — endpoint updateProfile, conteúdo de Plan/Landing/Export

### ACH-019
- titulo: Dark themes não persistem
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c79379b
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/providers/theme-provider.tsx
  - docs/UI-THEME-FOLLOWUP.md (novo)
- descricao_correcao: cookie wbc-theme/wbc-mode (1y, SameSite=Lax) alem de localStorage; ThemeProvider aceita initialTheme/initialMode; helper parseThemeCookies para SSR; follow-up doc com 5 itens
- observacoes: validação humana — wire-up do root layout para ler o cookie

### ACH-020
- titulo: Typography mobile sem tokens
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: eed0c77
- commit_revisor: none
- arquivos_alterados:
  - apps/mobile/src/screens/new-sale-screen.tsx (headerTitle/headerStep)
  - docs/UI-MOBILE-TYPOGRAPHY-FOLLOWUP.md (novo)
- descricao_correcao: textStyles['heading-2']/textStyles.caption aplicados nos headers; follow-up lista os 12 estilos restantes em new-sale-screen + sweep nas demais telas
- observacoes: validação humana — completar sweep, adicionar ESLint rule

### ACH-004
- titulo: Touch targets <44×44 mobile
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 705e868
- commit_revisor: none
- arquivos_alterados:
  - apps/mobile/src/screens/new-sale-screen.tsx
- descricao_correcao: backButton 36→44; deliveryButton minHeight 48; toggleIconBox 40→44
- observacoes: none

### ACH-023
- titulo: VIP desconto sem feedback
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d7a833b
- commit_revisor: none
- arquivos_alterados:
  - apps/mobile/src/screens/new-sale-screen.tsx
- descricao_correcao: VIP −5% badge (rounded pill, primaryContainer bg) ao lado do nome do cliente com accessibilityLabel explicativo
- observacoes: none

### ACH-025 (nao_corrigivel)
- titulo: Upload hipotético
- severidade: baixo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: Feature de upload não existe; documentar quando introduzida
