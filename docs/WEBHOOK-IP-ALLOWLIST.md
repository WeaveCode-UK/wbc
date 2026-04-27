# Webhook IP allow-list — ACH-051

## Status

**Deferred / not enforced.** This document captures the intent and the
operational reason we have not turned the gate on yet. Defense-in-depth
on top of HMAC; the HMAC verification is the primary control.

## Intent

The HMAC signature check on `/api/webhooks/mercadopago` and
`/api/webhooks/whatsapp` proves the message originated from a party
that holds the shared secret. An IP allow-list adds a second control:
even a leaked secret cannot be exercised from outside the provider's
egress IPs.

## Why we're not enforcing it yet

- **MercadoPago** publishes a list of egress IPs in the developer docs,
  but the list mutates without notice (we see drift every few weeks
  from the operational logs). Every drift would lock out legitimate
  webhooks until ops updates the allow-list.
- **Meta WhatsApp** publishes the IPv4/IPv6 ranges via
  `https://www.facebook.com/whitehat/networks` but the ranges are
  large and change with their infra rollouts.
- The cost of a missed legitimate webhook (silent reconciliation
  failure → financial gap) is higher than the cost of a leaked secret
  scenario (which we already mitigate via secret rotation cadence and
  HMAC).

## Plan

1. Subscribe ops to the MercadoPago + Meta IP-range change feeds.
2. Encode the ranges in `deploy/nginx.conf` as a `geo` block, with
   `allow` for trusted ranges and `deny all` at the end of each
   `location /api/webhooks/<provider>/`.
3. Wire a CI job that pulls the published ranges weekly and opens a
   PR when they change (similar pattern to `next-auth-watch.yml`).
4. Until 1-3 land, the secrets policy in `SECURITY.md`
   (`MERCADOPAGO_WEBHOOK_SECRET`, `WHATSAPP_APP_SECRET` rotated every
   90 days) is the compensating control.

## What is enforced today

- HMAC on every webhook (rejection on mismatch — see
  `verifyMercadoPagoSignature` and the WhatsApp handler).
- Replay protection via Redis dedup (ACH-026).
- nginx-level rate-limit (ACH-047, ACH-070).
- Body size cap 256 KiB on `/api/webhooks/*` (ACH-049).
- Audit-logged on signature failure (alert `WebhookSignatureFailures`,
  ACH-064).
