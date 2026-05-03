"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  MetricCard,
  SegmentedControl,
} from "@wbc/ui";
import { Wallet } from "lucide-react";
import { trpc } from "@/lib/trpc";

type StatusFilter = "all" | "DRAFT" | "CONFIRMED" | "DELIVERED" | "CANCELLED";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

function statusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "CONFIRMED":
      return "info";
    case "DRAFT":
      return "neutral";
    case "CANCELLED":
      return "danger";
    default:
      return "warning";
  }
}

export default function SalesPage() {
  const t = useTranslations("sales");
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const sales = trpc.sales.list.useQuery({
    page: 1,
    limit: 50,
    status: filter === "all" ? undefined : filter,
  });

  const finance = trpc.finance.getDashboard.useQuery({});

  const data = sales.data?.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("title")}
        </h1>
        <Link href="/sales/new">
          <Button type="button" size="sm">
            {t("new_sale")}
          </Button>
        </Link>
      </header>

      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
        <MetricCard
          label={t("total")}
          value={formatBRL(Number(finance.data?.revenue ?? 0))}
        />
        <MetricCard
          label={t("accounts_receivable")}
          value={formatBRL(Number(finance.data?.receivables ?? 0))}
        />
        <MetricCard
          label={filter === "all" ? t("items") : t("items_filtered")}
          value={String(sales.data?.meta?.total ?? 0)}
        />
      </div>

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as StatusFilter)}
        options={[
          { value: "all", label: t("filter_all") },
          { value: "DRAFT", label: t("filter_draft") },
          { value: "CONFIRMED", label: t("filter_confirmed") },
          { value: "DELIVERED", label: t("filter_delivered") },
          { value: "CANCELLED", label: t("filter_cancelled") },
        ]}
      />

      <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-2 sm:p-4">
        {sales.isLoading && <ListSkeleton count={6} />}

        {!sales.isLoading && data.length === 0 && (
          <EmptyState
            icon={
              <Wallet
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={t("no_sales")}
            description={t("no_sales_hint")}
            action={
              <Link href="/sales/new">
                <Button type="button" size="sm">
                  {t("new_sale")}
                </Button>
              </Link>
            }
          />
        )}

        {!sales.isLoading &&
          data.map((sale) => (
            <ListItem
              key={sale.id}
              title={formatBRL(Number(sale.total ?? 0))}
              subtitle={`${formatDate(sale.createdAt)}${sale.paymentMethod ? ` · ${sale.paymentMethod}` : ""}`}
              onClick={() => router.push(`/sales/${sale.id}`)}
              right={
                <Badge variant={statusVariant(sale.status)}>
                  {sale.status}
                </Badge>
              }
            />
          ))}
      </div>
    </div>
  );
}
