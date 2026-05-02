"use client";

import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  MetricCard,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

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

export default function FinancePage() {
  const t = useTranslations("finance");
  const dashboard = trpc.finance.getDashboard.useQuery({});
  const expenses = trpc.finance.listExpenses.useQuery({ page: 1, limit: 20 });
  const receivables = trpc.sales.getAccountsReceivable.useQuery({});

  const dashData = dashboard.data;
  const expensesData = expenses.data?.data ?? [];
  const receivablesData = receivables.data?.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm">
          {t("new_expense")}
        </Button>
      </div>

      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("revenue")}
          value={formatBRL(Number(dashData?.revenue ?? 0))}
        />
        <MetricCard
          label={t("expenses")}
          value={formatBRL(Number(dashData?.expenses ?? 0))}
        />
        <MetricCard
          label={t("profit")}
          value={formatBRL(Number(dashData?.profit ?? 0))}
        />
        <MetricCard
          label={t("receivables")}
          value={formatBRL(Number(dashData?.receivables ?? 0))}
        />
      </div>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 sm:p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("receivables")}
        </h2>
        <div className="mt-3">
          {receivables.isLoading && <ListSkeleton count={3} />}
          {!receivables.isLoading && receivablesData.length === 0 && (
            <EmptyState icon="📥" title={t("no_data")} />
          )}
          {!receivables.isLoading &&
            receivablesData.map((p) => (
              <ListItem
                key={p.id}
                title={formatBRL(Number(p.amount))}
                subtitle={`${formatDate(p.dueDate)}`}
                right={
                  <Badge variant={p.status === "PAID" ? "success" : "warning"}>
                    {p.status}
                  </Badge>
                }
              />
            ))}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 sm:p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("expenses")}
        </h2>
        <div className="mt-3">
          {expenses.isLoading && <ListSkeleton count={3} />}
          {!expenses.isLoading && expensesData.length === 0 && (
            <EmptyState icon="💸" title={t("no_data")} />
          )}
          {!expenses.isLoading &&
            expensesData.map((e) => (
              <ListItem
                key={e.id}
                title={e.description}
                subtitle={`${formatDate(e.date)}${e.category ? ` · ${e.category}` : ""}`}
                right={
                  <span className="text-body-small text-[var(--color-danger-text)]">
                    {formatBRL(Number(e.amount))}
                  </span>
                }
              />
            ))}
        </div>
      </section>
    </div>
  );
}
