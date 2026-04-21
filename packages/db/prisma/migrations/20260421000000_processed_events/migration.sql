-- ACH-011 dados-persistencia: handler-side idempotency table.
-- Insert (eventId, handlerName) from within the handler's own
-- transaction; a retry hits the PK and the handler becomes a no-op.

CREATE TABLE "processed_events" (
  "eventId" UUID NOT NULL,
  "handlerName" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "processed_events_pkey" PRIMARY KEY ("eventId", "handlerName")
);

CREATE INDEX "processed_events_processedAt_idx" ON "processed_events"("processedAt");
