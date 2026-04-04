# ADR-003: Outbox Pattern with BullMQ for Async Communication

## Status
Accepted

## Context
Modules need to communicate asynchronously (e.g., sale confirmed triggers inventory update, post-sale flow, notifications). Direct coupling between modules violates modularity.

## Decision
Use outbox pattern: domain events are saved to an outbox table in the same transaction as the business operation. A background worker polls the outbox and dispatches events to registered handlers. BullMQ queues handle job processing for messaging, campaigns, schedule, and analytics.

## Consequences
- Modules communicate only via events
- At-least-once delivery via outbox polling
- BullMQ provides retry, backoff, and dead-letter queue
- Requires Redis as infrastructure dependency
