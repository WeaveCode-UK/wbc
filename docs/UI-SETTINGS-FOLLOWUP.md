# Settings — Follow-up (ACH-017, run 2026-04-19_08-47-24)

Origem: auditoria **ui-ux-fluxos** achado ACH-017 — "Settings é stub — sem
formulários nem persistência". Correção classificada como `corrigivel_parcial`
porque a feature completa é grande e depende de endpoints que não estão todos
implementados.

## Estado atual (pós-seed)

- `apps/web/src/app/(dashboard)/settings/page.tsx` virou tabbed com 4 tabs
  (Profile / Plan / Landing / Export), suporte a teclado via roles ARIA.
- `settings/_components/profile-settings-form.tsx` semeado como exemplo:
  react-hook-form + Zod, submit para `/api/trpc/platform.updateProfile`,
  feedback local de status (idle/saving/saved/error), `aria-live="polite"`.
- Plan / Landing / Export ainda renderizam o card descritivo original —
  marcados como stubs visíveis ao usuário.

## Pendências para validação humana

### 1. Endpoint `platform.updateProfile`

- Criar rota tRPC em `apps/api/src/trpc/routers/platform.ts` com
  `updateProfile` (input: `{ displayName, phone (dígitos), bio? }`).
- Validar tenant via `middleware/tenant` (multi-tenant safe).
- Retornar `{ ok: true }` ou `{ ok: false, code }` compatível com o
  form-client.

### 2. Tab **Plan**

- Listar plano atual (Plano B / Plano C) com preço e próximo ciclo.
- CTA "Trocar plano" abre `<ConfirmModal>` com detalhes da mudança.
- Integrar com `apps/api/src/modules/billing` quando disponível.

### 3. Tab **Landing**

- Formulário para título, subtítulo, slug, CTA, cover image.
- Preview lado a lado (se viewport `md+`).
- Persistir via `platform.updateLandingPage`.

### 4. Tab **Export Data**

- Botão "Exportar CSV" dispara job BullMQ (`exports.enqueue`) e mostra
  progresso via polling ou WebSocket.
- Enviar link assinado por e-mail quando completo.

### 5. Máscaras e i18n

- Campo telefone em Profile precisa integrar com `maskPhoneBR` via
  `MaskedFormField` (ver ACH-012); hoje o campo `phone` aceita livre.
- Mensagens de status (`Salvo`, etc.) precisam migrar para o namespace
  `platform` ou `common` — ver ACH-005 / docs/UI-I18N-FOLLOWUP.md.

## Critério de fechamento

- (1) 4 tabs funcionais com submit que persiste
- (2) testes E2E cobrindo cada tab (após fase 7 — ver roadmap de testes)
- (3) erros do servidor aparecem com `aria-live="polite"` e com código
  estruturado
