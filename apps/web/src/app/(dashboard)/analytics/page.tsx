"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { EmptyState, ListSkeleton, MetricCard, ProgressBar } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

// Item 11 do handoff: rota dedicada com sazonalidade + ranking de produtos
// + comparativo temporal (mês atual vs anterior vs ano anterior).

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const seasonality = trpc.analytics.getSeasonality.useQuery({
    monthsBack: 12,
  });
  const ranking = trpc.analytics.getProductRanking.useQuery({ limit: 10 });
  const temporal = trpc.analytics.getTemporalComparison.useQuery();

  const seasonalityMax = useMemo(() => {
    return Math.max(1, ...(seasonality.data ?? []).map((b) => b.revenue));
  }, [seasonality.data]);

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Análises
        </h1>
        <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          Como sua loja vem performando — sazonalidade, top produtos e
          comparativo temporal.
        </p>
      </header>

      <section
        aria-label="Comparativo temporal"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {temporal.isLoading && (
          <>
            <MetricCard label="Mês atual" value="…" />
            <MetricCard label="Mês anterior" value="…" />
            <MetricCard label="Ano anterior" value="…" />
          </>
        )}
        {temporal.data && (
          <>
            <MetricCard
              label="Mês atual"
              value={formatBRL(temporal.data.current.revenue)}
              change={`${temporal.data.current.salesCount} venda${temporal.data.current.salesCount === 1 ? "" : "s"}`}
            />
            <MetricCard
              label="Vs. mês anterior"
              value={formatBRL(temporal.data.previousMonth.revenue)}
              change={`${
                temporal.data.deltaVsPreviousMonthPct >= 0 ? "↑" : "↓"
              } ${formatPct(temporal.data.deltaVsPreviousMonthPct)}`}
            />
            <MetricCard
              label="Vs. mesmo mês ano anterior"
              value={formatBRL(temporal.data.sameMonthLastYear.revenue)}
              change={`${
                temporal.data.deltaVsLastYearPct >= 0 ? "↑" : "↓"
              } ${formatPct(temporal.data.deltaVsLastYearPct)}`}
            />
          </>
        )}
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-4 sm:p-5">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Sazonalidade — últimos 12 meses
        </h2>
        <p className="mt-1 text-[12px] text-[var(--wc-fg-3)]">
          Faturamento por mês. Use pra antecipar campanhas em meses fracos.
        </p>

        {seasonality.isLoading && (
          <div className="mt-4">
            <ListSkeleton count={4} />
          </div>
        )}

        {seasonality.data && seasonality.data.length === 0 && (
          <div className="mt-4">
            <EmptyState
              icon={
                <BarChart3
                  className="h-5 w-5 text-[var(--wc-purple)]"
                  strokeWidth={1.75}
                />
              }
              title="Sem dados de sazonalidade"
              description="Cadastre vendas confirmadas para começar a ver o padrão."
            />
          </div>
        )}

        {seasonality.data && seasonality.data.length > 0 && (
          <ul className="mt-4 space-y-2">
            {seasonality.data.map((bucket) => {
              const pct = (bucket.revenue / seasonalityMax) * 100;
              const label = `${MONTH_LABELS[bucket.month - 1]} ${bucket.year}`;
              return (
                <li
                  key={`${bucket.year}-${bucket.month}`}
                  className="space-y-1"
                >
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--wc-fg-2)]">{label}</span>
                    <span className="text-[var(--wc-fg-1)]">
                      {formatBRL(bucket.revenue)} · {bucket.salesCount} v.
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-4 sm:p-5">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Top produtos
        </h2>
        <p className="mt-1 text-[12px] text-[var(--wc-fg-3)]">
          Ranking por quantidade vendida (vendas confirmadas/entregues).
        </p>

        {ranking.isLoading && (
          <div className="mt-4">
            <ListSkeleton count={5} />
          </div>
        )}

        {ranking.data && ranking.data.length === 0 && (
          <div className="mt-4">
            <EmptyState
              icon={
                <BarChart3
                  className="h-5 w-5 text-[var(--wc-purple)]"
                  strokeWidth={1.75}
                />
              }
              title="Sem ranking ainda"
              description="O ranking aparece após as primeiras vendas."
            />
          </div>
        )}

        {ranking.data && ranking.data.length > 0 && (
          <ol className="mt-4 space-y-2">
            {ranking.data.map((item, idx) => (
              <li
                key={item.productId}
                className="flex items-center justify-between border-b border-[var(--wc-border)] pb-2 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--wc-purple-50)] text-[12px] font-semibold text-[var(--wc-purple)]">
                    {idx + 1}
                  </span>
                  <span className="text-[13px] text-[var(--wc-fg-1)]">
                    {item.productId.slice(0, 8)}…
                  </span>
                </div>
                <div className="text-right text-[12px] text-[var(--wc-fg-2)]">
                  <div>{item.totalQuantity} un</div>
                  <div className="text-[var(--wc-fg-3)]">
                    {formatBRL(item.totalRevenue)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
