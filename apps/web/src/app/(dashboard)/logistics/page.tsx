"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  SegmentedControl,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface DeliveryRow {
  id: string;
  saleId: string;
  clientId: string;
  method: string;
  status: string;
  trackingCode: string | null;
  address: string | null;
  estimatedDays: number | null;
  createdAt: Date | string;
}

type StatusFilter = "all" | "CONFIRMED" | "SEPARATED" | "SHIPPED" | "DELIVERED";

function statusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "SHIPPED":
      return "info";
    case "SEPARATED":
      return "warning";
    case "CONFIRMED":
      return "neutral";
    default:
      return "neutral";
  }
}

export default function LogisticsHubPage() {
  const t = useTranslations("logistics");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const list = trpc.logistics.listDeliveries.useQuery({
    status: filter === "all" ? undefined : filter,
  });

  const rows = (list.data ?? []) as unknown as DeliveryRow[];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("title")}
        </h1>
        <Link href="/logistics/route">
          <Button type="button" size="sm">
            {t("daily_route")}
          </Button>
        </Link>
      </header>

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as StatusFilter)}
        options={[
          { value: "all", label: t("filter_all") },
          { value: "CONFIRMED", label: t("status_confirmed") },
          { value: "SEPARATED", label: t("status_separated") },
          { value: "SHIPPED", label: t("status_shipped") },
          { value: "DELIVERED", label: t("status_delivered") },
        ]}
      />

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-3 sm:p-5">
        {list.isLoading && <ListSkeleton count={6} />}
        {!list.isLoading && rows.length === 0 && (
          <EmptyState
            icon={
              <Package
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={t("no_deliveries")}
          />
        )}
        {rows.map((d) => (
          <ListItem
            key={d.id}
            title={`${d.method} · ${d.address ?? "—"}`}
            subtitle={d.trackingCode ?? d.saleId}
            right={<Badge variant={statusVariant(d.status)}>{d.status}</Badge>}
          />
        ))}
      </section>
    </div>
  );
}
