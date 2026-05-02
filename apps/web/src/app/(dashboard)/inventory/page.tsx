"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  SegmentedControl,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

type StockFilter = "all" | "low" | "out";

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const [filter, setFilter] = useState<StockFilter>("all");

  const stock = trpc.inventory.listStock.useQuery({});
  const orders = trpc.inventory.listOrders.useQuery({});

  const stockData = stock.data ?? [];
  const ordersData = orders.data ?? [];

  const filtered = stockData.filter((s) => {
    if (filter === "low") return s.quantity > 0 && s.quantity <= s.minAlert;
    if (filter === "out") return s.quantity <= 0;
    return true;
  });

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm">
          {t("new_order")}
        </Button>
      </div>

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as StockFilter)}
        options={[
          { value: "all", label: t("title") },
          { value: "low", label: t("low_stock") },
          { value: "out", label: t("no_stock") },
        ]}
      />

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)] mb-3">
          {t("stock")}
        </h2>
        {stock.isLoading && <ListSkeleton count={6} />}
        {!stock.isLoading && filtered.length === 0 && (
          <EmptyState
            icon="📦"
            title={t("no_stock")}
            description={t("no_stock_hint")}
          />
        )}
        {!stock.isLoading &&
          filtered.map((s) => {
            const variant: "success" | "warning" | "danger" =
              s.quantity <= 0
                ? "danger"
                : s.quantity <= s.minAlert
                  ? "warning"
                  : "success";
            const label =
              s.quantity <= 0
                ? t("no_stock")
                : s.quantity <= s.minAlert
                  ? t("low_stock")
                  : `${s.quantity}`;
            return (
              <ListItem
                key={s.id}
                title={s.productId}
                subtitle={`${t("quantity")}: ${s.quantity} · ${t("min_alert")}: ${s.minAlert}`}
                right={<Badge variant={variant}>{label}</Badge>}
              />
            );
          })}
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)] mb-3">
          {t("orders")}
        </h2>
        {orders.isLoading && <ListSkeleton count={3} />}
        {!orders.isLoading && ordersData.length === 0 && (
          <EmptyState icon="🚚" title={t("no_stock")} />
        )}
        {!orders.isLoading &&
          ordersData.map((o) => (
            <ListItem
              key={o.id}
              title={o.brandId}
              subtitle={new Date(o.orderedAt).toLocaleDateString("pt-BR")}
              right={<Badge variant="info">{o.status}</Badge>}
            />
          ))}
      </section>
    </div>
  );
}
