# Inbound Webhooks (ACH-003 / ACH-004 apis-integracoes)

## Routes

| Provider    | Path                        | Method(s)                                  |
| ----------- | --------------------------- | ------------------------------------------ |
| WhatsApp    | `/api/webhooks/whatsapp`    | `GET` (verify challenge) + `POST` (events) |
| MercadoPago | `/api/webhooks/mercadopago` | `POST` (notifications)                     |

Both live under `apps/web/src/app/api/webhooks/*/route.ts` (Next.js App
Router, `runtime: "nodejs"` since both use `crypto`).

## Security layers (POST)

Each webhook fails with a distinct status so you can read intent from
the access log:

1. **Signature** — HMAC-SHA256 with a provider-specific shared secret.
   Bad signature → 401. Missing secret env → 500.
2. **Timestamp window** — `|now − event_ts| > 300 s` → 400 `stale
webhook`. Guards against replays of intercepted payloads.
   (WhatsApp only — MP's signature already embeds its own ts.)
3. **Request-id dedup** — `SET … NX EX 600` in Redis on a hash of the
   provider-supplied `x-request-id`. Duplicate → 409. Missing Redis or
   missing header → pass (signature + ts still guard).
4. **Content parse** — invalid JSON → 400.

## Provider-specific notes

### WhatsApp (Meta)

- Meta sends `GET` first with `hub.mode=subscribe&hub.verify_token=…`
  plus `hub.challenge`. Echo the challenge plain-text if the token
  matches `WHATSAPP_VERIFY_TOKEN`.
- POST signature header: `x-hub-signature-256: sha256=<hex>`.
- App secret env: `WHATSAPP_APP_SECRET`.
- Timestamps pulled from `entry[0].changes[0].value.statuses[0]
.timestamp` (unix seconds). Payload without a status event fails the
  timestamp check (that's fine — no status, nothing to dedup).

### MercadoPago

- Signature header: `x-signature: ts=<unix>,v1=<hmac>`.
- Secret env: `MERCADOPAGO_WEBHOOK_SECRET` (set in the MP dashboard
  under "Webhooks").
- Template verified: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
  per MP's 2024 spec.

## What's still pending (follow-up)

- Forward the parsed WhatsApp status events to a use-case that updates
  `Message.status` and publishes a domain event.
- Wire the MercadoPago payload into a payment-sync use-case
  (`Payment.status`, publish `PAYMENT_RECEIVED`).
- Smoke-test both routes end-to-end with real provider dashboards —
  needs credentials only the operator has.
- Alerting for signature failures (should be zero in steady state; a
  spike usually means a rotated secret or an attacker probing).
