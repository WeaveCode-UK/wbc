import * as Network from "expo-network";
import {
  bumpQueueAttempt,
  listPendingMutations,
  removeFromQueue,
} from "./offline-db";

// F11.E18: pending-mutations drain. The mobile app calls
// `runSyncOnce(tenantId, send)` whenever the network reports
// reachable; the supplied `send` is a tRPC client invocation
// resolved by the host (apps/mobile keeps no direct dependency on
// @trpc/client so this file stays test-friendly).
//
// Conflict policy: last-write-wins by server timestamp. The server
// already trusts its own `updatedAt`, so a client write that lands
// on top of a newer server row is ignored downstream — the queue
// only retries when the failure looks transient (network/5xx).

const MAX_ATTEMPTS = 5;
const RETRYABLE_STATUS = new Set([
  "FETCH_ERROR",
  "TIMEOUT",
  "INTERNAL_SERVER_ERROR",
]);

export type SendMutation = (
  operation: string,
  payload: unknown,
) => Promise<void>;

export interface SyncReport {
  drained: number;
  failed: number;
  skipped: number;
}

export async function isOnline(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export async function runSyncOnce(
  tenantId: string,
  send: SendMutation,
): Promise<SyncReport> {
  if (!(await isOnline())) {
    return { drained: 0, failed: 0, skipped: 0 };
  }

  const pending = await listPendingMutations(tenantId);
  let drained = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of pending) {
    if (entry.attemptCount >= MAX_ATTEMPTS) {
      // Permanent failure — leave the entry for the user to inspect
      // in the (future) "queue" screen. The cron skips it.
      skipped++;
      continue;
    }
    try {
      const payload = JSON.parse(entry.payload) as unknown;
      await send(entry.operation, payload);
      await removeFromQueue(entry.id);
      drained++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      const isRetryable = Array.from(RETRYABLE_STATUS).some((tag) =>
        message.toUpperCase().includes(tag),
      );
      if (isRetryable) {
        await bumpQueueAttempt(entry.id, message);
        failed++;
      } else {
        // Non-retryable (validation, conflict): drop the entry to
        // avoid a deadlock on the queue. The server-side audit log
        // captures the offending payload via the tRPC procedure.
        await removeFromQueue(entry.id);
        failed++;
      }
    }
  }

  return { drained, failed, skipped };
}
