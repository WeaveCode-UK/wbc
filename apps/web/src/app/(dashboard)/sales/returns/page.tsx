"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, EmptyState, Input, ListItem, ListSkeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

export default function ReturnsPage() {
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState("");

  const list = trpc.sales.listReturns.useQuery({ limit: 100 });
  // F11.E20.5: real sale selector. Eligible sales are those that
  // were delivered — DRAFT and CANCELLED can't be returned.
  const eligibleSales = trpc.sales.list.useQuery({
    page: 1,
    limit: 50,
    status: "DELIVERED",
  });

  const utils = trpc.useUtils();
  const create = trpc.sales.createReturn.useMutation({
    onSuccess: () => {
      setSelectedSaleId(null);
      setReason("");
      setRefund("");
      void utils.sales.listReturns.invalidate();
      toast.success(tCommon("save"));
    },
    onError: (err) => toast.error(err.message),
  });

  const rows = list.data ?? [];
  const sales = eligibleSales.data?.data ?? [];
  const selectedSale = sales.find((s) => s.id === selectedSaleId);

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/sales"
        className="text-body-small text-[var(--wc-purple)] hover:underline"
      >
        ← {t("title")}
      </Link>

      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        Devoluções
      </h1>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Nova devolução
        </h2>

        <div className="space-y-1">
          <p className="text-caption text-[var(--wc-fg-3)]">Venda</p>
          <div className="max-h-48 overflow-y-auto rounded-md bg-[var(--wc-bg-muted)] divide-y divide-[var(--wc-border)]">
            {eligibleSales.isLoading && <ListSkeleton count={3} />}
            {!eligibleSales.isLoading && sales.length === 0 && (
              <p className="p-3 text-caption text-[var(--wc-fg-3)]">
                {t("no_sales")}
              </p>
            )}
            {sales.map((sale) => {
              const checked = selectedSaleId === sale.id;
              return (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => setSelectedSaleId(sale.id)}
                  className={
                    "block w-full text-left px-3 py-2 transition-colors " +
                    (checked ? "bg-[var(--wc-purple-50)]" : "hover:bg-white")
                  }
                >
                  <span className="text-body-small text-[var(--wc-fg-1)]">
                    {formatBRL(Number(sale.total))}
                  </span>
                  <span className="ml-2 text-caption text-[var(--wc-fg-3)]">
                    {formatDate(sale.createdAt)} · {sale.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-caption text-[var(--wc-fg-3)]">Motivo</p>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: produto chegou avariado"
          />
        </div>

        <div className="space-y-1">
          <p className="text-caption text-[var(--wc-fg-3)]">Valor a estornar</p>
          <Input
            type="number"
            min={0}
            step="0.01"
            max={selectedSale ? Number(selectedSale.total) : undefined}
            value={refund}
            onChange={(e) => setRefund(e.target.value)}
            placeholder="0,00"
          />
          {selectedSale && (
            <p className="text-caption text-[var(--wc-fg-3)]">
              Total da venda: {formatBRL(Number(selectedSale.total))}
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={() =>
            selectedSaleId &&
            reason &&
            refund &&
            create.mutate({
              saleId: selectedSaleId,
              reason,
              refundAmount: Number(refund),
            })
          }
          loading={create.isPending}
          disabled={create.isPending || !selectedSaleId || !reason || !refund}
        >
          {tCommon("confirm")}
        </Button>
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={4} />}
        {!list.isLoading && rows.length === 0 && (
          <EmptyState icon="↩️" title="Nenhuma devolução" />
        )}
        {rows.map((r) => (
          <ListItem
            key={r.id}
            title={formatBRL(Number(r.refundAmount))}
            subtitle={`${formatDate(r.createdAt)} · ${r.reason}`}
          />
        ))}
      </section>
    </div>
  );
}
