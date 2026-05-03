"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/logistics"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        🗺️ {t("daily_route")}
      </h1>
      <p className="text-caption text-[var(--color-text-tertiary)]">
        {t(stops.length === 1 ? "route_subtitle_one" : "route_subtitle_other", {
          count: stops.length,
        })}
      </p>

      {route.isLoading && <ListSkeleton count={4} variant="card" />}
      {!route.isLoading && stops.length === 0 && (
        <EmptyState icon="🗺️" title={t("no_route")} />
      )}

      {!route.isLoading &&
        Array.from(grouped.entries()).map(([key, items]) => (
          <section
            key={key}
            className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 sm:p-4 space-y-2"
          >
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
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
