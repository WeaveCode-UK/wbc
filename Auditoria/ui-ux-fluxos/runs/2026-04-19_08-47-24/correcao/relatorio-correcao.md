# Relatório de Correção

## Identificação
- dominio: ui-ux-fluxos
- run_id: 2026-04-19_08-47-24
- branch: fix/ui-ux-fluxos/2026-04-19_08-47-24
- data_inicio: 2026-04-23 00:00:00
- data_conclusao: 2026-04-23 02:45:00
- ultima_atualizacao: 2026-04-23 02:45:00
- status: concluido

## Resumo Executivo
Correção completa da run de auditoria ui-ux-fluxos, que havia registrado 25 achados
(5 altos, 14 médios, 6 baixos). 24 achados foram executados em sequência ordenada
por proximidade de arquivo, sem paralelização na Fase Revisor. 20 achados entraram
como `corrigivel` e 4 como `corrigivel_parcial` (i18n, Settings, dark theme persist,
typography mobile) — cada parcial veio com seed de código + doc de follow-up em
`docs/UI-*-FOLLOWUP.md`. Um achado (`ACH-025` upload hipotético) foi classificado
como não-corrigível por não existir código correspondente.

A Fase Revisor (Opus-only, sequencial, git diff obrigatório) aprovou todos os 24
achados sem intervenção — nenhum commit `review-fix` necessário. Type check passou
em 7/7 pacotes; build Next.js passou em 4/4 apps, 22 páginas estáticas geradas sem
erro.

## Estatísticas
- total_achados_na_run: 25
- aprovados_para_correcao: 24
- corrigidos_pelo_executor: 24
- aprovados_pelo_revisor_sem_alteracao: 24
- corrigidos_pelo_revisor: 0
- falha_executor_resolvida_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- falha_total: 0
- taxa_de_acerto_do_executor: 100%

## Validação Técnica
- type_check: passou (7/7 pacotes via turbo)
- build: passou (4/4 apps — api, web, worker, landing — 22 páginas estáticas web)
- tentativas_de_correcao_build: 0
- bloqueio_build: nao
- erro_persistente: none

## Achados Corrigidos (Executor acertou de primeira — 20)
- ACH-001 (alto) — Mobile bottom-nav expõe 9 rotas via menu "Mais"
- ACH-002 (alto) — Reflow mobile do dashboard (<md)
- ACH-003 (alto) — Wire-up de onClick/onPress em quick actions e new-sale
- ACH-004 (alto) — Touch targets mobile >= 44×44
- ACH-006 (medio) — Helper <ListSkeleton>
- ACH-007 (medio) — EmptyState com CTA nas listagens clients/sales
- ACH-008 (medio) — aria-label em quick actions + aria-hidden em emojis
- ACH-009 (medio) — h1 semântico = page name, greeting vira subtítulo
- ACH-010 (medio) — Contraste AA em text-tertiary e classification C
- ACH-011 (medio) — aria-live polite no container de erro do Input
- ACH-012 (medio) — Máscaras BR (phone/CPF/CNPJ)
- ACH-013 (medio) — Focus trap e autoFocus no ConfirmModal
- ACH-014 (medio) — ConfirmModal antes de enviar link de reset
- ACH-015 (baixo) — Toggle de visibilidade em Input password
- ACH-016 (medio) — StepIndicator no onboarding desktop
- ACH-018 (medio) — isLoading + spinner no ConfirmModal
- ACH-021 (baixo) — type="button" explícito
- ACH-022 (baixo) — active:scale + ring no feedback de quick actions
- ACH-023 (baixo) — Badge VIP −5% visível no new-sale
- ACH-024 (medio) — useId() + htmlFor/id explícitos no onboarding

## Achados Corrigidos com Intervenção do Revisor
Nenhum. Revisor aprovou todas as correções do executor sem alteração.

## Achados Parciais (requerem validação humana — 4)

### ACH-005 — i18n parcial (alto)
- **Feito:** `packages/i18n/src/locales/{pt-BR,en}/errors.json` semeado com
  `validation.*` (15 chaves); `apps/web/src/lib/zod-i18n.ts` expõe
  `installZodI18n(t)` / `zodI18nErrorMap(t)`.
- **Pendente:** wire-up em layouts cliente, sweep de strings JSX hardcoded,
  ESLint rule, códigos discriminados na API, locale-aware `Intl.*`.
- **Follow-up:** `docs/UI-I18N-FOLLOWUP.md`.

### ACH-017 — Settings stub (medio)
- **Feito:** Settings reescrito como tabbed (Profile/Plan/Landing/Export) com
  ARIA completo; `profile-settings-form.tsx` implementa form real com
  react-hook-form + Zod + submit stubbado para `/api/trpc/platform.updateProfile`.
- **Pendente:** endpoint updateProfile, conteúdo real de Plan/Landing/Export,
  MaskedFormField, i18n de status.
- **Follow-up:** `docs/UI-SETTINGS-FOLLOWUP.md`.

### ACH-019 — Dark themes não persistem (baixo)
- **Feito:** `theme-provider.tsx` persiste em localStorage + cookie
  (`wbc-theme`, `wbc-mode`, 1y, SameSite=Lax); aceita `initialTheme`/`initialMode`;
  helper `parseThemeCookies` para SSR.
- **Pendente:** wire-up do root layout para ler cookie, unificação com mobile
  (AsyncStorage), honrar `prefers-color-scheme`, script inline anti-FOUC.
- **Follow-up:** `docs/UI-THEME-FOLLOWUP.md`.

### ACH-020 — Typography mobile sem tokens (medio)
- **Feito:** `packages/ui-native/src/theme/typography-styles.ts` já existia com
  8 tokens; migrado `headerTitle`/`headerStep` de new-sale-screen para
  `textStyles['heading-2']`/`textStyles.caption` como exemplo.
- **Pendente:** migrar os outros 12 estilos hardcoded em new-sale-screen,
  sweep nas demais telas mobile, ESLint rule anti-hardcoded-font.
- **Follow-up:** `docs/UI-MOBILE-TYPOGRAPHY-FOLLOWUP.md`.

## Achados Não Corrigíveis (1)

### ACH-025 — Upload hipotético (baixo, hipótese)
- **Motivo:** A feature de upload não existe no repositório. O achado foi
  registrado como hipótese/expectativa de auditoria.
- **Ação recomendada ao usuário:** Quando a feature de upload for introduzida,
  implementar validações (max 5 MB, image/*) e mensagens inline de erro/progresso
  no mesmo PR. Adicionar entrada em `docs/UI-UPLOAD-GUIDE.md` quando for o caso.

## Achados Não Aprovados pelo Usuário
Nenhum. Aprovação "todos" herdada da campanha "todos os 15 domínios".

## Achados com Falha Total
Nenhum.

## Commits Gerados

### Estrutura
- `fd80ae6` chore(auditoria): inicializar correção

### Executor (24 commits fix(auditoria))
- `445d480` ACH-011 — aria-live polite no container de erro do Input
- `66ebe12` ACH-015 — toggle de visibilidade em Input password
- `1bc3567` ACH-013 — focus trap e autoFocus no ConfirmModal
- `ddd0ccb` ACH-018 — isLoading + spinner no ConfirmModal
- `cc74f77` ACH-010 — contraste AA em text-tertiary e classification C
- `ad878f8` ACH-002 — reflow mobile do dashboard (<md)
- `379f892` ACH-001 — bottom-nav mobile expõe 9 rotas via menu "Mais"
- `a61f049` ACH-009 — h1 semântico = page name
- `e050e85` ACH-008 — aria-label em quick actions + aria-hidden em emojis
- `2118746` ACH-021 — type="button" explícito
- `7ab1fe7` ACH-022 — active:scale + ring no feedback
- `b265945` ACH-003 — wire-up de onClick/onPress
- `58ede7c` ACH-016 — StepIndicator no onboarding desktop
- `05757e9` ACH-024 — useId() + htmlFor/id explícitos no onboarding
- `eb2e2f5` ACH-012 — máscaras BR (phone/CPF/CNPJ)
- `041f974` ACH-014 — ConfirmModal antes de enviar link de reset
- `8ac5dbd` ACH-005 — seed de i18n (parcial)
- `7bfd598` ACH-006 — helper <ListSkeleton>
- `d5ff52a` ACH-007 — EmptyState com CTA nas listagens
- `b84ffed` ACH-017 — Settings tabbed + seed de Profile form (parcial)
- `c79379b` ACH-019 — cookie + SSR-ready theme persistence (parcial)
- `eed0c77` ACH-020 — migração seed para textStyles (parcial)
- `705e868` ACH-004 — touch targets mobile >= 44×44
- `d7a833b` ACH-023 — badge VIP −5% visível

### Transição e Revisor
- `498ecdb` chore(auditoria): fase executor concluída — transição para revisor
- `99eca6d` chore(auditoria): revisor aprovou 24 achados

### Relatório
- este commit — chore(auditoria): relatório final de correção

## Merge
- status_merge: concluido
- branch_origem: fix/ui-ux-fluxos/2026-04-19_08-47-24
- branch_destino: main
- aprovado_por_usuario: sim (aprovação "todos" herdada da campanha)
- data_merge: 2026-04-23 02:50:00
- commit_merge: 0aa56ed
