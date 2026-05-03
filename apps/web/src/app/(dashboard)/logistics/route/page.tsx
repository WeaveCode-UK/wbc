"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Map as MapIcon } from "lucide-react";
import { Badge, EmptyState, ListItem, ListSkeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

export default function DailyRoutePage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("logistics");
  const route = trpc.logistics.getOrderedRoute.useQuery({});
  const stops = route.data ?? [];

  // Group by groupKey for visual ordering — same neighbourhood as a
  // header, then individual stops below.
  const grouped = new Map<string, typeof stops>();
  for (const stop of stops) {
    const key = stop.groupKey;
    const arr = grouped.get(key) ?? [];
    arr.push(stop);
    grouped.set(key, arr);
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <Link
        href="/logistics"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("daily_route")}
        </h1>
        <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          {t(
            stops.length === 1 ? "route_subtitle_one" : "route_subtitle_other",
            {
              count: stops.length,
            },
          )}
        </p>
      </header>

      {route.isLoading && <ListSkeleton count={4} variant="card" />}
      {!route.isLoading && stops.length === 0 && (
        <EmptyState
          icon={
            <MapIcon
              className="h-5 w-5 text-[var(--wc-purple)]"
              strokeWidth={1.75}
            />
          }
          title={t("no_route")}
        />
      )}

      {!route.isLoading &&
        Array.from(grouped.entries()).map(([key, items]) => (
          <section
            key={key}
            className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-3 sm:p-5 space-y-2"
          >
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {key === "ZZZ_sem_endereco" ? t("no_address") : key}
            </h2>
            {items.map((stop) => (
              <ListItem
                key={stop.deliveryId}
                title={stop.clientName}
                subtitle={stop.address ?? "—"}
                right={<Badge variant="info">{stop.status}</Badge>}
              />
            ))}
          </section>
        ))}
    </div>
  );
}
