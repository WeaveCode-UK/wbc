import { useEffect, useRef, useState } from "react";
import * as Network from "expo-network";
import {
  isOnline,
  runSyncOnce,
  type SendMutation,
  type SyncReport,
} from "./sync";

// F11.E27: hook that drains the SQLite mutation queue whenever the
// device transitions back online and on a 60s safety timer. The
// concrete `send` is supplied by the caller so this module stays
// free of a tRPC dependency (mobile does not currently bundle
// @trpc/client; this hook will be wired once that package lands).
//
// Returned `online` reflects the latest expo-network reading; UIs
// can use it to render a small offline pill.

const TICK_MS = 60_000;

export interface OnlineSyncState {
  online: boolean;
  lastReport: SyncReport | null;
  draining: boolean;
}

export function useOnlineSync(
  tenantId: string,
  send: SendMutation,
): OnlineSyncState {
  const [online, setOnline] = useState(true);
  const [lastReport, setLastReport] = useState<SyncReport | null>(null);
  const draining = useRef(false);
  const [drainingFlag, setDrainingFlag] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const drain = async () => {
      if (draining.current) return;
      const reachable = await isOnline();
      if (cancelled) return;
      setOnline(reachable);
      if (!reachable) return;
      draining.current = true;
      setDrainingFlag(true);
      try {
        const report = await runSyncOnce(tenantId, send);
        if (cancelled) return;
        setLastReport(report);
      } catch {
        // swallow — runSyncOnce already records per-entry failures
      } finally {
        draining.current = false;
        setDrainingFlag(false);
      }
    };

    void drain();
    const interval = setInterval(() => {
      void drain();
    }, TICK_MS);

    const sub = Network.addNetworkStateListener?.((state) => {
      if (cancelled) return;
      const reachable = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );
      setOnline(reachable);
      if (reachable) void drain();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub?.remove?.();
    };
  }, [tenantId, send]);

  return { online, lastReport, draining: drainingFlag };
}
