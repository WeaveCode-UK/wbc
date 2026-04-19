# Achados da Auditoria

## Identificação
- dominio: ui-ux-fluxos
- run_id: 2026-04-19_08-47-24
- ultima_atualizacao: 2026-04-19 08:55:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Contexto
Auditoria estática (sem clique em produto). Análise baseada em código fonte de apps/web (Next.js 15 App Router + shadcn/ui + Tailwind), apps/landing, apps/mobile (React Native 0.81 + Expo) e design tokens (packages/shared/src/theme, packages/ui).

## Achados Registrados

### ACH-001
- titulo: Mobile — rotas de Finance/Inventory/Campaigns/Team/Settings inacessíveis pela bottom nav
- severidade: alto
- categoria: navegacao
- status: confirmado
- resumo: `apps/web/src/components/sidebar.tsx` expõe 9 rotas, mas `bottom-nav.tsx` só tem 4 (My Day, Clients, Sales, Schedule). Em mobile não há menu hamburger; as demais features ficam inacessíveis.

#### Evidencia
- arquivo_ou_area: apps/web/src/components/sidebar.tsx; apps/web/src/components/bottom-nav.tsx
- detalhe: Sem fallback de menu para mobile

#### Impacto
- tecnico: Rotas críticas ocultas em viewport `<md`
- negocio: Consultora em campo sem acesso a Finance/Inventory

#### Recomendacao
- acao_sugerida: Menu hamburger com as 9 rotas ou sub-menu "Mais"; ou revisão do bottom-nav para incluir itens essenciais
- prioridade: alta

---

### ACH-002
- titulo: Dashboard não reflow para viewport `<md` — layout desktop-first
- severidade: alto
- categoria: responsividade
- status: confirmado
- resumo: `apps/web/src/app/(dashboard)/layout.tsx` mantém sidebar `hidden md:flex`; grid principal `grid-cols-2 lg:grid-cols-4` reduz cards ilegíveis em 375px. Sem breakpoint `sm:` nem padding/fonte adaptados.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/layout.tsx:37; apps/web/src/app/(dashboard)/page.tsx:17,37

#### Impacto
- tecnico: Layout inutilizável em mobile browser
- negocio: Consultoras em campo sem acesso usável

#### Recomendacao
- acao_sugerida: Stack vertical em `<md`; fontes reduzidas (12-14px); padding 12px; teste em iPhone SE (375px)
- prioridade: alta

---

### ACH-003
- titulo: Ações de dashboard não possuem handlers nem feedback (`onClick` vazios)
- severidade: alto
- categoria: feedback
- status: confirmado
- resumo: Quick actions em `apps/web/src/app/(dashboard)/page.tsx:41-56` são botões sem `onClick`. Mobile `new-sale-screen.tsx:187-195` tem callbacks `() => {}`.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/page.tsx; apps/mobile/src/screens/new-sale-screen.tsx:187-195

#### Impacto
- tecnico: Consultora clica e nada acontece
- negocio: Percepção de produto quebrado

#### Recomendacao
- acao_sugerida: Wire-up dos handlers (navigation + mutations) com toast (sonner) para sucesso/erro; skeletons durante espera
- prioridade: alta

---

### ACH-004
- titulo: Touch targets abaixo de 44×44 px em mobile
- severidade: alto
- categoria: acessibilidade-mobile
- status: confirmado
- resumo: `apps/mobile/src/screens/new-sale-screen.tsx:25` (back button 36×36) e itens do grid de delivery têm altura efetiva ~32-36 px. Apple HIG e Material recomendam 44-48 px.

#### Evidencia
- arquivo_ou_area: apps/mobile/src/screens/new-sale-screen.tsx:25,115-139

#### Impacto
- tecnico: Erros de toque em contexto de uso realista
- negocio: Frustração, abandono de fluxo

#### Recomendacao
- acao_sugerida: `minHeight: 44` e `minWidth: 44`; padding maior em botões pequenos; hit slops quando necessário
- prioridade: alta

---

### ACH-005
- titulo: i18n parcial — validações e mensagens hardcoded em pt
- severidade: alto
- categoria: i18n
- status: confirmado
- resumo: `useTranslations('auth')` está presente, porém mensagens de validação (`minLength`, `pattern`), loading ("...") e empty states "Sem clientes" aparecem em português hardcoded. Suporte a EN não é real.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/onboarding/page.tsx:67-72,110; apps/web/src/app/(dashboard)/{clients,sales}/page.tsx

#### Impacto
- tecnico: `messages/en.json` pode ficar incompleto/imperceptível
- negocio: Promessa multi-idioma não cumprida

#### Recomendacao
- acao_sugerida: Consolidar strings em `messages/{pt,en}.json`; validar Zod com mensagens localizadas (map de erro por código); regra ESLint para barrar strings inline em JSX
- prioridade: alta

---

### ACH-006
- titulo: Ausência de loading skeletons em listas
- severidade: medio
- categoria: feedback
- status: confirmado
- resumo: Pages de clients/sales não usam `Suspense` + `Skeleton`. Tailwind `animate-pulse` não aparece.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/clients/page.tsx; apps/web/src/app/(dashboard)/sales/page.tsx

#### Impacto
- tecnico: Usuário não sabe se está carregando ou vazio
- negocio: Ansiedade em redes lentas

#### Recomendacao
- acao_sugerida: Skeleton por item (card/list) via `Suspense` ou estado local; helper `<ListSkeleton count={N} />`
- prioridade: media

---

### ACH-007
- titulo: Empty state com `<div>Sem clientes</div>` — não usa `EmptyState` pronto
- severidade: medio
- categoria: consistencia
- status: confirmado
- resumo: Existe componente `EmptyState` em `packages/ui/src/components/empty-state.tsx`, mas as listagens inline renderizam divs simples sem CTA ("Adicionar primeiro cliente").

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/{clients,sales}/page.tsx; packages/ui/src/components/empty-state.tsx

#### Impacto
- tecnico: Inconsistência visual
- negocio: Sem CTA para primeira ação

#### Recomendacao
- acao_sugerida: Substituir por `<EmptyState icon="…" title="…" action={<Button>…</Button>} />`
- prioridade: media

---

### ACH-008
- titulo: `aria-label` ausente em botões só com ícone/emoji
- severidade: medio
- categoria: acessibilidade
- status: confirmado
- resumo: Quick actions usam emoji sem rótulo acessível; FAB "+" tem `aria-label` genérico ("create").

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/page.tsx:41-56; apps/web/src/components/bottom-nav.tsx

#### Impacto
- tecnico: Leitor de tela descreve apenas o ícone
- negocio: Acessibilidade reduzida

#### Recomendacao
- acao_sugerida: `aria-label={t('action_new_sale')}` e congêneres; substituir emoji por `lucide-react` com `aria-hidden` + texto
- prioridade: media

---

### ACH-009
- titulo: Hierarquia de `h1`/`h2`/`h3` quebrada no dashboard
- severidade: medio
- categoria: acessibilidade-e-semantica
- status: confirmado
- resumo: Dashboard usa `<h1>` para saudação e `<h2>` para cards, sem `<h1>` por página após navegação. Hierarquia desordenada atrapalha navegação assistida.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/page.tsx:13,39,61

#### Impacto
- tecnico: Outline do leitor de tela confuso
- negocio: Acessibilidade AA comprometida

#### Recomendacao
- acao_sugerida: Um `<h1>` por página; `<h2>` só em seções principais; `<h3>` em subsecções
- prioridade: media

---

### ACH-010
- titulo: Contraste marginal em `--color-text-tertiary`
- severidade: medio
- categoria: acessibilidade-visual
- status: confirmado
- resumo: Cor `#6B7280` sobre `#FFFFFF` ≈ 5.3:1. Passa WCAG AA (4.5:1) por pouco; falha AAA (7:1); pior no tema rose-dark.

#### Evidencia
- arquivo_ou_area: WBC-UI-UX-Design-System-v1.0.md:52; apps/web/src/app/(dashboard)/page.tsx:14,33

#### Impacto
- tecnico: Leitura prejudicada para baixa visão
- negocio: Público-alvo 50+ afetado

#### Recomendacao
- acao_sugerida: Ajustar para `#5A6370` ou mais escuro; revalidar temas dark/rose-dark
- prioridade: media

---

### ACH-011
- titulo: Forms sem `aria-live` em erros; feedback só após submit
- severidade: medio
- categoria: formularios-e-acessibilidade
- status: confirmado
- resumo: `FormField` wrapper não expõe erro com `aria-live="polite"`; inputs têm `aria-describedby`, mas erro aparece sem anúncio auditivo.

#### Evidencia
- arquivo_ou_area: apps/web/src/components/form-field.tsx:19-26; packages/ui/src/components/input.tsx:24-25

#### Impacto
- tecnico: Usuário descobre erro tarde
- negocio: Re-submissões aumentam

#### Recomendacao
- acao_sugerida: Container de erro com `aria-live="polite"` e `aria-atomic="true"`
- prioridade: media

---

### ACH-012
- titulo: Ausência de máscaras de entrada (telefone, CPF, CNPJ)
- severidade: medio
- categoria: prevencao-de-erro
- status: confirmado
- resumo: Onboarding usa `minLength={10}` sem `react-input-mask`. Dados ruins podem chegar ao DB; UX pior.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/onboarding/page.tsx:84

#### Impacto
- tecnico: Dados inconsistentes
- negocio: Integrações (WhatsApp/SMS) falham silenciosamente

#### Recomendacao
- acao_sugerida: `react-input-mask` ou `imask` com padrões BR; validar E.164 no submit (cross-ref seguranca/ACH-028)
- prioridade: media

---

### ACH-013
- titulo: Confirmação/cancelamento e ações destrutivas sem auto-focus e focus trap
- severidade: medio
- categoria: acessibilidade
- status: confirmado
- resumo: `packages/ui/src/components/confirm-modal.tsx` usa `<dialog>` nativo, sem `autoFocus` em confirmar/cancelar nem focus trap garantido para tab cycling.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/confirm-modal.tsx:31-55

#### Impacto
- tecnico: Teclado pode sair do modal
- negocio: Experiência ruim em ações críticas

#### Recomendacao
- acao_sugerida: Usar Radix Dialog (já disponível via shadcn) com trap/autoFocus; se manter `<dialog>`, acoplar `focus-trap-react`
- prioridade: media

---

### ACH-014
- titulo: Reset-password / Magic-link sem AlertDialog de confirmação
- severidade: medio
- categoria: prevencao-de-erro
- status: confirmado
- resumo: Links "Esqueci senha" e "Criar conta" não têm modal de confirmação antes de disparar fluxo; `ConfirmModal` está disponível mas não integrado.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/login/page.tsx; apps/web/src/app/(auth)/register/page.tsx; packages/ui/src/components/confirm-modal.tsx

#### Impacto
- tecnico: Ação acidental dispara fluxo de e-mail
- negocio: Custo de suporte

#### Recomendacao
- acao_sugerida: AlertDialog explicando "Vamos enviar um link..." + botões "Sim/Não"
- prioridade: media

---

### ACH-015
- titulo: Inputs de senha sem toggle de visibilidade
- severidade: baixo
- categoria: formularios
- status: confirmado
- resumo: `CredentialsForm` usa `type="password"` sem opção de mostrar/ocultar; usuários com senhas complexas digitam às cegas.

#### Evidencia
- arquivo_ou_area: apps/web/src/components/auth/credentials-form.tsx:82,85; packages/ui/src/components/input.tsx

#### Impacto
- tecnico: Aumenta taxa de erro
- negocio: Mais "esqueci senha"

#### Recomendacao
- acao_sugerida: Ícone olho em `Input` quando `type === 'password'`; a11y com `aria-pressed`
- prioridade: baixa

---

### ACH-016
- titulo: Onboarding desktop sem `StepIndicator` visual (existente)
- severidade: medio
- categoria: navegacao
- status: confirmado
- resumo: Onboarding desktop exibe "Step 1 of 3" como texto; `StepIndicator` já existe em packages/ui e é usado em mobile.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/onboarding/page.tsx:59; apps/mobile/src/screens/new-sale-screen.tsx:37

#### Impacto
- tecnico: Sem feedback visual de progresso
- negocio: Taxa de abandono no onboarding

#### Recomendacao
- acao_sugerida: Usar `StepIndicator` no onboarding desktop; sincronizar visual entre web e mobile
- prioridade: media

---

### ACH-017
- titulo: Settings é stub — sem formulários nem persistência
- severidade: medio
- categoria: fluxo
- status: confirmado
- resumo: `apps/web/src/app/(dashboard)/settings/page.tsx` lista seções como texto sem inputs; nenhuma ação funcional.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/settings/page.tsx:1-30

#### Impacto
- tecnico: Experiência inacabada
- negocio: Consultora não altera perfil/plano

#### Recomendacao
- acao_sugerida: Implementar tabs: Profile / Plan / Landing / Data Export; cada tab com form + submit (react-hook-form + Zod)
- prioridade: media

---

### ACH-018
- titulo: `ConfirmModal` sem loading state no botão destrutivo
- severidade: medio
- categoria: feedback
- status: confirmado
- resumo: Após clicar "Confirmar", modal não mostra spinner nem desabilita botão — consultora pode clicar múltiplas vezes.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/confirm-modal.tsx:41-52

#### Impacto
- tecnico: Mutações duplicadas (cross-ref apis-integracoes/ACH-001)
- negocio: Ações indevidas

#### Recomendacao
- acao_sugerida: Prop `isLoading`; botão confirm com spinner + `aria-busy`; desabilitar durante promise
- prioridade: media

---

### ACH-019
- titulo: Temas `default-dark` e `rose-dark` parcialmente implementados
- severidade: baixo
- categoria: design-system
- status: confirmado
- resumo: Design System declara 4 combinações (default light/dark, rose light/dark), mas `apps/web/src/app/(dashboard)/layout.tsx:21-24` só alterna default↔rose sem persistir dark mode.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/layout.tsx:21-24; WBC-UI-UX-Design-System-v1.0.md:2.1-2.4

#### Impacto
- tecnico: Preferência não persiste
- negocio: Frustração

#### Recomendacao
- acao_sugerida: Persistir em `localStorage` e enviar cookie para SSR; usar `next-themes` ou abordagem equivalente; `data-theme` consistente entre web e mobile
- prioridade: baixa

---

### ACH-020
- titulo: Typography no mobile com `fontFamily`/tamanhos hardcoded
- severidade: medio
- categoria: design-system-mobile
- status: confirmado
- resumo: `apps/mobile/src/screens/new-sale-screen.tsx` define fontes Epilogue/Sora/Manrope em StyleSheet; sem tokens centralizados em packages/ui-native.

#### Evidencia
- arquivo_ou_area: apps/mobile/src/screens/new-sale-screen.tsx:200-277

#### Impacto
- tecnico: Manutenção difícil
- negocio: Inconsistência entre telas mobile

#### Recomendacao
- acao_sugerida: `packages/ui-native/src/typography.ts` com tokens (heading1..caption) e helpers `styles(theme).text.headingN`
- prioridade: media

---

### ACH-021
- titulo: Falta `type="button"` em botões de ação dentro de páginas com formulários
- severidade: baixo
- categoria: acessibilidade
- status: confirmado
- resumo: Quick actions em dashboard e itens em bottom-nav são `<button>` sem `type="button"`, risco de comportamento imprevisível em forms.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/page.tsx:41-56; apps/web/src/components/bottom-nav.tsx:36

#### Impacto
- tecnico: Possível submit acidental
- negocio: Bugs estranhos em certos navegadores

#### Recomendacao
- acao_sugerida: `type="button"` explícito ou `<Link>` quando a intenção é navegar
- prioridade: baixa

---

### ACH-022
- titulo: Feedback `hover/active` pouco expressivo em cards/botões de ação
- severidade: baixo
- categoria: feedback
- status: confirmado
- resumo: Dashboard define `hover:bg-[--color-primary-surface-hover]` mas não usa `active:scale-95` ou ripple. Sem retorno tátil.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/page.tsx:41-56

#### Impacto
- tecnico: Sensação de "nada aconteceu"
- negocio: Dúvida se clicou

#### Recomendacao
- acao_sugerida: `transition + active:scale-98 + opacity-90`; consistência entre cards/botões
- prioridade: baixa

---

### ACH-023
- titulo: Feedback de aplicação de desconto VIP ausente
- severidade: baixo
- categoria: fluxo-e-feedback
- status: confirmado
- resumo: Mobile `new-sale-screen.tsx` menciona "Cliente VIP" mas não exibe toast/alert com "Desconto VIP (5%) aplicado" ao confirmar.

#### Evidencia
- arquivo_ou_area: apps/mobile/src/screens/new-sale-screen.tsx:56-59

#### Impacto
- tecnico: Consultora não vê benefício aplicado
- negocio: Menor percepção de valor

#### Recomendacao
- acao_sugerida: Toast contextual ou destaque visual no total ("VIP -5%")
- prioridade: baixa

---

### ACH-024
- titulo: Labels de inputs desassociadas por id dinâmico no onboarding
- severidade: medio
- categoria: acessibilidade
- status: confirmado
- resumo: `Label htmlFor={…}` depende de id auto-gerado; com caracteres especiais/i18n o match pode quebrar.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(auth)/onboarding/page.tsx:66,70,83

#### Impacto
- tecnico: Associação label↔input pode falhar; leitores de tela não informam
- negocio: Acessibilidade reduzida

#### Recomendacao
- acao_sugerida: Usar `FormField` que injeta `id` explícito; ou gerar via `useId()` do React e passar manualmente
- prioridade: media

---

### ACH-025
- titulo: Ausência de empty/error state padronizado para upload (se/ quando houver)
- severidade: baixo
- categoria: fluxo
- status: hipotese
- resumo: Não encontramos upload ativo; se feature de foto/documento aparecer, será necessário tratamento de tamanho/tipo com feedback inline.

#### Evidencia
- arquivo_ou_area: não encontrado em análise (hipótese)

#### Impacto
- tecnico: Se ativado sem validação, timeouts e erros obscuros
- negocio: Experiência ruim

#### Recomendacao
- acao_sugerida: Implementar upload com validação (max 5 MB; image/*) e mensagens inline quando a feature for introduzida
- prioridade: baixa
