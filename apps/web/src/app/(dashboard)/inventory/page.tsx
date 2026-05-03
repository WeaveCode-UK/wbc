"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package, Truck } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  SegmentedControl,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { AddOrderModal } from "@/components/add-order-modal";

type StockFilter = "all" | "low" | "out";

export default function InventoryPage() {
  const t = useTranslations("inventory");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [orderOpen, setOrderOpen] = useState(false);

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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm" onClick={() => setOrderOpen(true)}>
          {t("new_order")}
        </Button>
      </header>

      <AddOrderModal open={orderOpen} onClose={() => setOrderOpen(false)} />

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as StockFilter)}
        options={[
          { value: "all", label: t("title") },
          { value: "low", label: t("low_stock") },
          { value: "out", label: t("no_stock") },
        ]}
      />

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-3 sm:p-5">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)] mb-3">
          {t("stock")}
        </h2>
        {stock.isLoading && <ListSkeleton count={6} />}
        {!stock.isLoading && filtered.length === 0 && (
          <EmptyState
            icon={
              <Package
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={t("no_stock_empty")}
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
                title={s.productName}
                subtitle={`${s.brandName ? `${s.brandName} · ` : ""}${t("quantity")}: ${s.quantity} · ${t("min_alert")}: ${s.minAlert}`}
                right={<Badge variant={variant}>{label}</Badge>}
              />
            );
          })}
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-3 sm:p-5">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)] mb-3">
          {t("orders")}
        </h2>
        {orders.isLoading && <ListSkeleton count={3} />}
        {!orders.isLoading && ordersData.length === 0 && (
          <EmptyState
            icon={
              <Truck
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={t("no_stock")}
          />
        )}
        {!orders.isLoading &&
          ordersData.map((o) => (
            <ListItem
              key={o.id}
              title={o.brandName}
              subtitle={new Date(o.orderedAt).toLocaleDateString("pt-BR")}
              right={<Badge variant="info">{o.status}</Badge>}
            />
          ))}
      </section>
    </div>
  );
}
