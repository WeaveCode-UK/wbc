# ADR-004: OTP-Only Authentication via Auth.js

## Status
Accepted

## Context
Target users are beauty consultants in Brazil, primarily mobile-first. Password-based auth adds friction and security concerns (weak passwords, password reset flows).

## Decision
Authentication is OTP-only via phone number (WhatsApp/SMS). Auth.js (NextAuth) with Credentials provider handles the session. JWT carries tenantId, role, plan, and locale.

## Consequences
- No password storage or management
- Requires SMS/WhatsApp provider for OTP delivery
- Brute-force protection critical (rate limiting, attempt counter)
- Simple login flow for mobile users
