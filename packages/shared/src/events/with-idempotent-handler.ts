// ACH-011 dados-persistencia: wrapper that turns any handler into
// exactly-once-per-handler via the ProcessedEvent table.
//
// Usage inside a handler:
//
//   await withIdempotentHandler(
//     { eventId: event.id, handlerName: "inventory.sale-confirmed" },
//     claimer,
//     async () => { /* the side-effect */ },
//   );
//
// On the first call the claim succeeds, the effect runs, the row
// stays. On any subsequent call (retry, redelivery) the claim fails
// with P2002, the wrapper returns without invoking the effect.
//
// The `claimer` is injected (not imported) so this lives in `shared`
// without depending on `@wbc/db`. Adapters inject
// `ProcessedEventRepository` from the composition root; tests inject
// a fake.

export interface ProcessedEventClaimer {
  claim(eventId: string, handlerName: string): Promise<boolean>;
}

export interface IdempotentHandlerKey {
  eventId: string;
  handlerName: string;
}

export async function withIdempotentHandler(
  key: IdempotentHandlerKey,
  claimer: ProcessedEventClaimer,
  effect: () => Promise<void>,
): Promise<"executed" | "already_processed"> {
  const fresh = await claimer.claim(key.eventId, key.handlerName);
  if (!fresh) return "already_processed";
  await effect();
  return "executed";
}
