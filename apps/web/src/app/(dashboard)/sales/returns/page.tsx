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
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {t("title")}
      </Link>

      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        Devoluções
      </h1>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          Nova devolução
        </h2>

        <div className="space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            Venda
          </p>
          <div className="max-h-48 overflow-y-auto rounded-md bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-tertiary)]">
            {eligibleSales.isLoading && <ListSkeleton count={3} />}
            {!eligibleSales.isLoading && sales.length === 0 && (
              <p className="p-3 text-caption text-[var(--color-text-tertiary)]">
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
                    (checked
                      ? "bg-[var(--color-primary-surface)]"
                      : "hover:bg-[var(--color-bg-primary)]")
                  }
                >
                  <span className="text-body-small text-[var(--color-text-primary)]">
                    {formatBRL(Number(sale.total))}
                  </span>
                  <span className="ml-2 text-caption text-[var(--color-text-tertiary)]">
                    {formatDate(sale.createdAt)} · {sale.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            Motivo
          </p>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: produto chegou avariado"
          />
        </div>

        <div className="space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            Valor a estornar
          </p>
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
            <p className="text-caption text-[var(--color-text-tertiary)]">
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
          disabled={create.isPending || !selectedSaleId || !reason || !refund}
        >
          {create.isPending ? "..." : tCommon("confirm")}
        </Button>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
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
