import { useEffect, useState } from "react";
import { trpc } from "./trpc-client";
import { upsertClient, upsertSale, upsertAppointment } from "./offline-repos";

// F11 follow-up: cold-start hydration. After login the app fetches
// the canonical lists from the server and writes them into SQLite via
// the existing upsert helpers. The mobile screens already read from
// SQLite, so once this completes their useEffect picks up the rows
// and the mock fallback disappears.
//
// Triggered once per process (after auth) — for incremental refresh
// the screens can call individual fetches; this hook is the warm-up.

interface HydrationStats {
  clients: number;
  sales: number;
  appointments: number;
}

export interface HydrationState {
  done: boolean;
  error: string | null;
  stats: HydrationStats | null;
}

export function useHydration(tenantId: string): HydrationState {
  const [state, setState] = useState<HydrationState>({
    done: false,
    error: null,
    stats: null,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [clientsRes, salesRes, appointments] = await Promise.all([
          trpc.clients.list.query({ page: 1, limit: 200 }),
          trpc.sales.list.query({ page: 1, limit: 200 }),
          trpc.schedule.listAppointments.query({}).catch(() => [] as unknown[]),
        ]);
        if (cancelled) return;

        const clientList = (
          clientsRes as unknown as { data: Array<Record<string, unknown>> }
        ).data;
        const saleList = (
          salesRes as unknown as { data: Array<Record<string, unknown>> }
        ).data;

        for (const c of clientList) {
          await upsertClient({
            id: String(c.id),
            tenantId,
            name: String(c.name ?? ""),
            phone: String(c.phone ?? ""),
            email: (c.email as string | null) ?? null,
            classification:
              (c.classification as "A" | "B" | "C" | null) ?? null,
            isLead: c.isLead ? 1 : 0,
            isActive: c.isActive === false ? 0 : 1,
            updatedAt: new Date(
              (c.updatedAt as string | undefined) ?? Date.now(),
            ).getTime(),
            syncedAt: Date.now(),
          });
        }

        for (const s of saleList) {
          await upsertSale({
            id: String(s.id),
            tenantId,
            clientId: String(s.clientId ?? ""),
            total: Number(s.total ?? 0),
            status: String(s.status ?? "DRAFT"),
            paymentMethod: (s.paymentMethod as string | null) ?? null,
            createdAt: new Date(
              (s.createdAt as string | undefined) ?? Date.now(),
            ).getTime(),
            updatedAt: new Date(
              (s.updatedAt as string | undefined) ?? Date.now(),
            ).getTime(),
            syncedAt: Date.now(),
          });
        }

        const apptList = appointments as Array<Record<string, unknown>>;
        for (const a of apptList) {
          await upsertAppointment({
            id: String(a.id),
            tenantId,
            title: String(a.title ?? ""),
            type: String(a.type ?? "OTHER"),
            startsAt: new Date(
              (a.startsAt as string | undefined) ?? Date.now(),
            ).getTime(),
            address: (a.address as string | null) ?? null,
            updatedAt: new Date(
              (a.updatedAt as string | undefined) ?? Date.now(),
            ).getTime(),
            syncedAt: Date.now(),
          });
        }

        if (cancelled) return;
        setState({
          done: true,
          error: null,
          stats: {
            clients: clientList.length,
            sales: saleList.length,
            appointments: apptList.length,
          },
        });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "hydration_failed";
        setState({ done: true, error: msg, stats: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return state;
}
