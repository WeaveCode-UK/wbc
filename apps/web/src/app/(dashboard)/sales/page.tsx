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
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Link href="/sales/new">
          <Button type="button" size="sm">
            {t("new_sale")}
          </Button>
        </Link>
      </div>

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
          label={t("items")}
          value={String(sales.data?.meta?.total ?? 0)}
        />
      </div>

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as StatusFilter)}
        options={[
          { value: "all", label: t("title") },
          { value: "DRAFT", label: t("wizard_save_draft") },
          { value: "CONFIRMED", label: t("confirm") },
          { value: "DELIVERED", label: t("status") },
          { value: "CANCELLED", label: t("cancel") },
        ]}
      />

      <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {sales.isLoading && <ListSkeleton count={6} />}

        {!sales.isLoading && data.length === 0 && (
          <EmptyState
            icon="💰"
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
