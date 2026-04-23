# Progresso da Correção

## Identificação
- dominio: ui-ux-fluxos
- run_id: 2026-04-19_08-47-24
- branch: fix/ui-ux-fluxos/2026-04-19_08-47-24
- data_inicio: 2026-04-23 00:00:00
- ultima_atualizacao: 2026-04-23 02:30:00
- fase_atual: revisor
- status: revisor_concluido

## Resumo de Progresso
- total_aprovados: 24
- corrigidos_executor: 24
- revisados_revisor: 24
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 0

## Sumário da Fase Revisor (2026-04-23)

- revisados_sequencialmente: 24 (ordem do plano: ACH-011, 015, 013, 018, 010, 002, 001, 009, 008, 021, 022, 003, 016, 024, 012, 014, 005, 006, 007, 017, 019, 020, 004, 023)
- aprovados_direto: 24
- corrigidos_pelo_revisor: 0
- commits_review_fix: nenhum
- falhas_totais: 0
- classificacoes_parciais (seed+follow-up doc): ACH-005, ACH-017, ACH-019, ACH-020 — todos com doc de follow-up consistente e critérios de fechamento explícitos
- observacoes_macro:
  - todos os diffs conferem com os arquivos de estado atual; nenhum commit posterior quebrou correção anterior (ACH-011→ACH-015→ACH-018 mantiveram aria-live, focus trap e isLoading compatíveis em input.tsx e confirm-modal.tsx)
  - aderência a CSS vars / tokens em favor de classes Tailwind hardcoded (bg-blue-600 removido de clients/sales)
  - acessibilidade reforçada além do pedido: aria-current em bottom-nav links, aria-hidden em 100% dos spans de emoji decorativos, autoComplete=tel no phone, autoComplete=email no reset-password
  - 4 achados parciais têm docs/UI-*-FOLLOWUP.md com 5 itens cada + critério de fechamento — mapeamento completo das pendências humanas restantes
  - um ACH não-corrigível (ACH-025 — upload hipotético) mantém status nao_aplicavel corretamente

## Achados

### ACH-011
- titulo: Forms sem aria-live em erros
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 445d480
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/input.tsx
- descricao_correcao: container de erro envolvido por div com aria-live="polite" e aria-atomic="true"; role="alert" removido (polite menos intrusivo que assertive implícito)
- observacoes: revisor validou container aria-live presente no estado atual (input.tsx:79); estrutura preservada após ACH-015

### ACH-015
- titulo: Inputs de senha sem toggle de visibilidade
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 66ebe12
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/input.tsx
  - apps/web/src/components/form-field.tsx
  - apps/web/src/components/auth/credentials-form.tsx
- descricao_correcao: prop togglePassword em Input; botão com aria-pressed+aria-controls; CredentialsForm ativa em password/confirmPassword
- observacoes: revisor validou botão toggle com 44x44 min, aria-label dinâmico (Show/Hide), aria-pressed, aria-controls={inputId}; CredentialsForm expõe togglePassword em ambos password/confirmPassword

### ACH-013
- titulo: ConfirmModal sem focus trap e autoFocus
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 1bc3567
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/confirm-modal.tsx
- descricao_correcao: autoFocus em confirm; handleKeyDown trava Tab/Shift+Tab entre confirm/cancel; aria-describedby
- observacoes: revisor validou queueMicrotask focus em abertura, handleKeyDown ciclando confirm↔cancel em ambas direções, aria-labelledby + aria-describedby; estrutura preservada após ACH-018

### ACH-018
- titulo: ConfirmModal sem isLoading
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: ddd0ccb
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/confirm-modal.tsx
- descricao_correcao: prop isLoading + aria-busy; botões disabled; spinner no confirm; cancel desabilitado durante loading
- observacoes: revisor validou handleConfirm guard contra dupla-invocação, aria-busy no dialog e confirm, spinner visual com aria-hidden, cancel também disabled; caller controla close via prop open quando loading

### ACH-010
- titulo: Contraste marginal em text-tertiary
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: cc74f77
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/theme/colors.ts
- descricao_correcao: textTertiary light vira #5A5261 (era md3.outline #7D7387 ≈ 4.2:1); classification C texto vira #4B5563 (era #6B7280)
- observacoes: revisor validou #5A5261 em colors.ts:163 e #4B5563 em classificationColors.C; comentários ACH-010 preservados para rastreabilidade; dark mantido

### ACH-002
- titulo: Dashboard desktop-first sem reflow <md
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: ad878f8
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: breakpoint sm:; grid-cols-1 em <sm; fontes/heading escalam sm:→md:; padding 3/6
- observacoes: revisor validou grid-cols-1 sm:grid-cols-2 lg:grid-cols-4, headings text-heading-3 sm:text-heading-2, padding p-3 sm:p-6; iPhone SE 375px agora viewport-safe

### ACH-001
- titulo: Mobile bottom-nav sem acesso a 5 rotas
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 379f892
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/components/bottom-nav.tsx
  - packages/i18n/src/locales/{pt-BR,en}/common.json
- descricao_correcao: botão "More" central abre menu com Campaigns/Finance/Inventory/Team/Settings; ESC fecha; aria-haspopup; chave nav_more em pt/en
- observacoes: revisor validou aria-haspopup/aria-expanded/aria-controls, role=menu+menuitem, ESC handler, close-on-route, aria-current em links primários, touch targets 44x44; novas chaves nav_more consistentes pt/en

### ACH-009
- titulo: Hierarquia h1/h2/h3 no dashboard
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: a61f049
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: h1 agora é identidade da página (nav_my_day); greeting e summary viram <p>
- observacoes: revisor validou <header> semântico, h1=nav_my_day, greeting/summary em <p>; h2/h3 mantidos nas seções (Quick Actions/Today)

### ACH-008
- titulo: aria-label ausente em botões com ícone/emoji
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: e050e85
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: aria-label explícito em quick actions; aria-hidden nos spans de emoji; birthday_today com span aria-hidden
- observacoes: revisor validou todos 4 quick actions com aria-label + spans de emoji com aria-hidden=true; consistente com bottom-nav; birthday_today separa span decorativo 🎂

### ACH-021
- titulo: type="button" explícito
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 2118746
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
  - apps/web/src/app/(dashboard)/layout.tsx
- descricao_correcao: type="button" em todos os botões não-submit do dashboard e toggles de tema
- observacoes: revisor validou type=button em 4 quick actions + 3 today-items + theme toggle + mode toggle; bottom-nav já trata via ACH-001

### ACH-022
- titulo: Feedback hover/active pouco expressivo
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7ab1fe7
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
- descricao_correcao: active:scale-[0.98], active:opacity-90, focus:ring; transition-all duration-150
- observacoes: revisor validou 4 quick actions com active:scale+opacity e focus:ring com ring-offset; consistência visual nos 4 botões

### ACH-003
- titulo: onClick vazios no dashboard e mobile
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: b265945
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/page.tsx
  - apps/mobile/src/screens/new-sale-screen.tsx
- descricao_correcao: quick actions web → router.push; Today section → /finance, /inventory, /campaigns; mobile NewSaleScreen recebe props onBack/onSaveDraft/onConfirmSale com fallback Alert
- observacoes: revisor validou 7 handlers web (4 quick + 3 today) e 3 handlers mobile (back/saveDraft/confirm) com fallback Alert; mutations+toast (sonner) corretamente rastreado como follow-up na descricao

### ACH-016
- titulo: Onboarding desktop sem StepIndicator
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 58ede7c
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(auth)/onboarding/page.tsx
- descricao_correcao: StepIndicator (0-indexed) aparece entre h1 e texto step; texto mantém (current de total) para redundância semântica
- observacoes: revisor validou import de @wbc/ui/components/step-indicator e current={step-1} mapeando corretamente step 1→0, 2→1, 3→2; reforço textual mantém AA

### ACH-024
- titulo: Labels htmlFor com id dinâmico
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 05757e9
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(auth)/onboarding/page.tsx
- descricao_correcao: useId() para nameId/slugId/phoneId; htmlFor e id explícitos; aria-describedby no hint do slug
- observacoes: revisor validou useId() em 3 inputs, aria-describedby slug→hint, inputMode=tel e autoComplete=tel no phone (bônus a11y)

### ACH-012
- titulo: Máscaras de entrada BR
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: eb2e2f5
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/lib/masks.ts (novo)
  - apps/web/src/app/(auth)/onboarding/page.tsx
- descricao_correcao: maskPhoneBR/maskCPF/maskCNPJ + onlyDigits/phoneDigits; aplicado em phone do onboarding (submit envia só dígitos)
- observacoes: revisor validou helpers progressivos por comprimento, submit com phoneDigits (raw) consistente com E.164 ready; CPF/CNPJ helpers disponíveis para usos futuros (Settings/clients)

### ACH-014
- titulo: Reset-password/Magic-link sem AlertDialog
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 041f974
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(auth)/reset-password/page.tsx
  - packages/i18n/src/locales/{pt-BR,en}/auth.json
- descricao_correcao: submit agora abre ConfirmModal com email; cancel/confirmar; isLoading; 3 novas chaves i18n resetPassword.confirmTitle/Description/Send
- observacoes: revisor validou decisão de confirmar no submit (não nos links) — o recurso escasso é o envio de email, não a navegação; interpolação {email} na descrição + isLoading propagado; autoComplete=email adicional

### ACH-005
- titulo: i18n parcial — validações e empty states hardcoded em pt
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 8ac5dbd
- commit_revisor: none
- arquivos_alterados:
  - packages/i18n/src/locales/{pt-BR,en}/errors.json (seed validation.*)
  - apps/web/src/lib/zod-i18n.ts (novo)
  - docs/UI-I18N-FOLLOWUP.md (novo)
- descricao_correcao: seed de errors.validation (required/invalid_email/too_small/too_big/regex_mismatch/phone_br/cpf/cnpj...); helper zodI18nErrorMap + installZodI18n(t); follow-up doc com 5 itens pendentes
- observacoes: revisor aprovou seed+doc (regra corrigivel_parcial); 16 chaves validation.* paritárias pt/en, zodI18nErrorMap cobre invalid_type/invalid_string/too_small/too_big/invalid_date; UI-I18N-FOLLOWUP.md lista 5 pendências + critério de fechamento

### ACH-006
- titulo: Loading skeletons em listas
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7bfd598
- commit_revisor: none
- arquivos_alterados:
  - packages/ui/src/components/list-skeleton.tsx (novo)
  - packages/ui/src/index.ts
- descricao_correcao: helper <ListSkeleton count=N variant='list'|'card'>; role=status aria-live aria-busy sr-only Loading
- observacoes: revisor validou componente com animate-pulse, variants list/card, ARIA completo (role=status + aria-live=polite + aria-busy + aria-label + sr-only); adoção em listas fica para fase com data-fetching

### ACH-007
- titulo: EmptyState nas listagens
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: d5ff52a
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/clients/page.tsx
  - apps/web/src/app/(dashboard)/sales/page.tsx
- descricao_correcao: divs simples substituídas por <EmptyState> com ícone emoji, título, descrição e CTA Button
- observacoes: revisor validou EmptyState com ícone+título+description+action em ambas as páginas; bônus: headers com responsividade p-3 sm:p-6 e migração de bg-blue-600 para CSS vars do tema

### ACH-017
- titulo: Settings stub sem formulários
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: b84ffed
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/app/(dashboard)/settings/page.tsx (tabbed)
  - apps/web/src/app/(dashboard)/settings/_components/profile-settings-form.tsx (novo)
  - docs/UI-SETTINGS-FOLLOWUP.md (novo)
- descricao_correcao: Settings virou tabbed (Profile/Plan/Landing/Export) com roles ARIA; Profile tem form react-hook-form + Zod com submit stubbado; Plan/Landing/Export ainda são placeholders rastreados em follow-up
- observacoes: revisor aprovou seed+doc (regra corrigivel_parcial); role=tablist+tab+tabpanel com aria-selected/aria-controls/aria-labelledby corretos; ProfileSettingsForm com useId para statusId e aria-live no feedback; UI-SETTINGS-FOLLOWUP.md com 5 pendências

### ACH-019
- titulo: Dark themes não persistem
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: c79379b
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/providers/theme-provider.tsx
  - docs/UI-THEME-FOLLOWUP.md (novo)
- descricao_correcao: cookie wbc-theme/wbc-mode (1y, SameSite=Lax) alem de localStorage; ThemeProvider aceita initialTheme/initialMode; helper parseThemeCookies para SSR; follow-up doc com 5 itens
- observacoes: revisor aprovou seed+doc (regra corrigivel_parcial); cookie+localStorage dupla persistência, parseThemeCookies com whitelist rose/dark (seguro contra injeção); follow-up inclui snippet pronto para app/layout.tsx

### ACH-020
- titulo: Typography mobile sem tokens
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: eed0c77
- commit_revisor: none
- arquivos_alterados:
  - apps/mobile/src/screens/new-sale-screen.tsx (headerTitle/headerStep)
  - docs/UI-MOBILE-TYPOGRAPHY-FOLLOWUP.md (novo)
- descricao_correcao: textStyles['heading-2']/textStyles.caption aplicados nos headers; follow-up lista os 12 estilos restantes em new-sale-screen + sweep nas demais telas
- observacoes: revisor aprovou seed+doc (regra corrigivel_parcial); textStyles confirmado exportado em @wbc/ui-native/src/index.ts; follow-up enumera 12 migrações na própria tela, sweep em demais telas, ESLint rule e critério de fechamento

### ACH-004
- titulo: Touch targets <44×44 mobile
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 705e868
- commit_revisor: none
- arquivos_alterados:
  - apps/mobile/src/screens/new-sale-screen.tsx
- descricao_correcao: backButton 36→44; deliveryButton minHeight 48; toggleIconBox 40→44
- observacoes: revisor validou backButton 44×44 com minWidth+minHeight e width+height (defensivo), deliveryButton minHeight 48 (preserva paddingVertical 16), toggleIconBox 44×44; comentários ACH-004 preservados

### ACH-023
- titulo: VIP desconto sem feedback
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: d7a833b
- commit_revisor: none
- arquivos_alterados:
  - apps/mobile/src/screens/new-sale-screen.tsx
- descricao_correcao: VIP −5% badge (rounded pill, primaryContainer bg) ao lado do nome do cliente com accessibilityLabel explicativo
- observacoes: revisor validou clientNameRow com flexWrap, badge pill borderRadius 999 com primaryContainer+onPrimary (contraste), accessibilityLabel descritivo "Cliente VIP, desconto de 5% aplicado"

### ACH-025 (nao_corrigivel)
- titulo: Upload hipotético
- severidade: baixo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: Feature de upload não existe; documentar quando introduzida
