# Achados da Auditoria

## Identificacao
- dominio: ui-ux-fluxos
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Severidades Permitidas
- critico, alto, medio, baixo, informativo

## Status Permitidos
- aberto, confirmado, mitigado, resolvido, aceito, nao_aplicavel

## Achados Registrados

### ACH-UX-001
- titulo: useTranslations usado em 22 paginas e componentes
- severidade: informativo
- categoria: i18n
- status: confirmado
- resumo: O hook useTranslations e importado em 22 arquivos cobrindo: todas as 8 dashboard pages, layout, sidebar, bottom-nav, auth pages (login, register, verify-email, reset-password, workspace, invite, onboarding, suspended) e form components (credentials-form, google-login-button).

#### Evidencia
- arquivo_ou_area: apps/web/src/app/(dashboard)/*.tsx, apps/web/src/app/(auth)/*.tsx, apps/web/src/components/*.tsx
- detalhe: 22 arquivos com import de useTranslations. Zero hardcoded strings encontradas nas paginas.

#### Impacto
- tecnico: Internacionalizacao pronta para pt-BR e en.
- negocio: Expansao internacional facilitada.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-UX-002
- titulo: ARIA attributes em 10+ componentes UI
- severidade: informativo
- categoria: acessibilidade
- status: confirmado
- resumo: Os componentes UI usam atributos ARIA consistentemente: Button (aria-busy), Input (aria-invalid, aria-describedby), ConfirmModal (aria-labelledby), SearchBar, Toast, ActionSheet, SegmentedControl, ProgressBar, ToggleSwitch e Tag possuem aria-* attributes.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/*.tsx
- detalhe: 12 arquivos contendo aria-* attributes. Input tem aria-invalid com role="alert" no error. Button tem aria-busy.

#### Impacto
- tecnico: Acessibilidade basica para screen readers.
- negocio: Inclusao de usuarios com deficiencia visual.

#### Recomendacao
- acao_sugerida: Nenhuma. Implementacao solida.
- prioridade: nenhuma

---

### ACH-UX-003
- titulo: Touch targets minimos de 44px em botoes (mobile-first)
- severidade: informativo
- categoria: mobile-ux
- status: confirmado
- resumo: O componente Button usa h-11 (44px) como altura minima para sizes sm e xs em mobile (`h-11 px-3` para sm, `h-11 px-2` para xs), colapsando para h-8/h-7 em desktop via `md:h-8`/`md:h-7`. Tamanhos lg e md sao h-12 e h-11 respectivamente.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/button.tsx:26-30
- detalhe: `sm: 'h-11 px-3 text-caption rounded-sm md:h-8'`, `xs: 'h-11 px-2 text-caption rounded-sm md:h-7'`

#### Impacto
- tecnico: Touch targets atendem guideline WCAG de 44px minimo.
- negocio: Usabilidade mobile adequada para consultoras de beleza (publico-alvo).

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-UX-004
- titulo: ConfirmModal usa native dialog element
- severidade: informativo
- categoria: componentes
- status: confirmado
- resumo: ConfirmModal usa `<dialog>` nativo com showModal/close, garantindo focus trapping e backdrop nativos do browser. Ref-based control com useEffect.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/confirm-modal.tsx
- detalhe: `<dialog ref={dialogRef} onClose={onClose} aria-labelledby="confirm-modal-title">`. Uso de dialog.showModal() e dialog.close().

#### Impacto
- tecnico: Focus trapping e ESC key handling nativos. Sem dependencia de library de modal.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-UX-005
- titulo: ConfirmModal com labels hardcoded em portugues
- severidade: medio
- categoria: i18n
- status: confirmado
- resumo: O ConfirmModal tem defaults `confirmLabel = 'Confirmar'` e `cancelLabel = 'Cancelar'` hardcoded em portugues. Embora sejam overrideable via props, os defaults violam a regra "zero strings hardcoded na UI".

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/confirm-modal.tsx:17
- detalhe: `confirmLabel = 'Confirmar', cancelLabel = 'Cancelar'` como defaults no function parameter.

#### Impacto
- tecnico: Em contexto en, os botoes aparecerao em portugues se nao forem passados labels.
- negocio: UX inconsistente para usuarios em ingles.

#### Recomendacao
- acao_sugerida: Remover defaults ou usar chaves i18n. Os chamadores devem sempre passar labels traduzidos.
- prioridade: media

---

### ACH-UX-006
- titulo: Design system usa CSS custom properties para theming
- severidade: informativo
- categoria: design-system
- status: confirmado
- resumo: Todos os componentes UI usam CSS custom properties (var(--color-primary), var(--color-bg-primary), etc.) para cores, permitindo temas claro/escuro e customizacao.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/button.tsx, input.tsx, confirm-modal.tsx
- detalhe: `bg-[var(--color-primary)]`, `text-[var(--color-text-primary)]`, `border-[var(--color-border-secondary)]` em todos os componentes.

#### Impacto
- tecnico: Theming centralizado e extensivel.
- negocio: Possibilidade futura de white-label.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-UX-007
- titulo: 24 componentes UI no design system
- severidade: informativo
- categoria: design-system
- status: confirmado
- resumo: O pacote packages/ui possui 24 componentes: Button, Input, Card, Badge, Tag, Avatar, Alert, Toast, ActionSheet, ConfirmModal, SearchBar, FilterChips, SegmentedControl, ToggleSwitch, ProgressBar, Skeleton, ListItem, Timeline, StepIndicator, FunnelChart, EmptyState.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/*.tsx
- detalhe: 24 arquivos .tsx em components/ (excluindo __tests__/).

#### Impacto
- tecnico: Design system abrangente para o MVP.
- negocio: Consistencia visual em toda a plataforma.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-UX-008
- titulo: Input component com label/error/helper integrados
- severidade: informativo
- categoria: formularios
- status: confirmado
- resumo: O componente Input encapsula label, mensagem de erro com role="alert" e helper text com aria-describedby automatico. Gera id automaticamente a partir do label.

#### Evidencia
- arquivo_ou_area: packages/ui/src/components/input.tsx
- detalhe: `aria-invalid={error ? true : undefined}`, `aria-describedby={error ? '${inputId}-error' : helper ? '${inputId}-helper' : undefined}`. Error com role="alert".

#### Impacto
- tecnico: Formularios acessiveis e consistentes.
- negocio: Melhor UX em formularios.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma
