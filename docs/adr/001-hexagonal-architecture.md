# ADR-001: Hexagonal Architecture

## Status
Accepted

## Context
WBC Platform is a multi-tenant CRM for beauty consultants. The domain logic (clients, sales, campaigns, etc.) needs to be testable independently of infrastructure (database, messaging, external APIs).

## Decision
Adopt hexagonal (ports and adapters) architecture for all business modules. Domain and use-cases define ports (interfaces). Infrastructure details live in adapters (Prisma repositories, API clients, etc.).

## Consequences
- Use-cases are testable without database
- Replacing Prisma or PostgreSQL requires only new adapters
- Modules are decoupled from infrastructure choices
- More files per module (port + adapter + use-case)
