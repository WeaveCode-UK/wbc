"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

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
  const [saleId, setSaleId] = useState("");
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState("");

  const list = trpc.sales.listReturns.useQuery({ limit: 100 });
  const utils = trpc.useUtils();
  const create = trpc.sales.createReturn.useMutation({
    onSuccess: () => {
      setSaleId("");
      setReason("");
      setRefund("");
      void utils.sales.listReturns.invalidate();
    },
  });

  const rows = list.data ?? [];

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
        <Input
          value={saleId}
          onChange={(e) => setSaleId(e.target.value)}
          placeholder="ID da venda (UUID)"
        />
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo"
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          value={refund}
          onChange={(e) => setRefund(e.target.value)}
          placeholder="Valor a estornar"
        />
        {create.error && <Alert variant="danger">{create.error.message}</Alert>}
        <Button
          type="button"
          onClick={() =>
            saleId &&
            reason &&
            refund &&
            create.mutate({
              saleId,
              reason,
              refundAmount: Number(refund),
            })
          }
          disabled={create.isPending || !saleId || !reason || !refund}
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
