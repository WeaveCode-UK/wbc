"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote, Inbox, Meh, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  MetricCard,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";
import { PixModal } from "../../../components/pix-modal";
import { AddExpenseModal } from "@/components/add-expense-modal";

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
  const tCommon = useTranslations("common");
  const toast = useToast();
  const dashboard = trpc.finance.getDashboard.useQuery({});
  const expenses = trpc.finance.listExpenses.useQuery({ page: 1, limit: 20 });
  const receivables = trpc.sales.getAccountsReceivable.useQuery({});
  const nps = trpc.platform.npsStats.useQuery();
  const pixConfig = trpc.platform.getPixConfig.useQuery();
  const [pixModal, setPixModal] = useState<{
    code: string;
    qrBase64?: string;
    caption?: string;
  } | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const generatePix = trpc.sales.generatePix.useMutation({
    onSuccess: (result) => {
      setPixModal({
        code: result.pixQrCode,
        caption: "PIX estático — confirme manualmente quando receber.",
      });
    },
    onError: (err) => toast.error(err.message),
  });
  const generateMpPix = trpc.sales.generateMpPix.useMutation({
    onSuccess: (result) => {
      setPixModal({
        code: result.pixQrCode,
        qrBase64: result.qrCodeBase64,
        caption: `PIX automático via Mercado Pago — confirma sozinho. Expira ${new Date(result.expiresAt).toLocaleString("pt-BR")}.`,
      });
      void utils.sales.getAccountsReceivable.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const utils = trpc.useUtils();
  const hasMercadoPago = Boolean(
    process.env.NEXT_PUBLIC_MERCADOPAGO_ENABLED === "true",
  );

  const dashData = dashboard.data;
  const expensesData = expenses.data?.data ?? [];
  const receivablesData = receivables.data?.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm" onClick={() => setExpenseOpen(true)}>
          {t("new_expense")}
        </Button>
      </div>

      <AddExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
      />

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

      {nps.data && nps.data.responded > 0 && (
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-heading-2 text-[var(--color-text-primary)]">
                NPS
              </h2>
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {nps.data.responded}/{nps.data.total}
              </p>
            </div>
            <div
              className="text-heading-1"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {nps.data.npsScore}
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-caption">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-success-bg)] px-2 py-1 text-[var(--color-success-text)]">
              <ThumbsUp
                className="h-3 w-3"
                strokeWidth={2}
                aria-hidden="true"
              />
              {nps.data.promoters}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-bg-secondary)] px-2 py-1 text-[var(--color-text-secondary)]">
              <Meh className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              {nps.data.passives}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-danger-bg)] px-2 py-1 text-[var(--color-danger-text)]">
              <ThumbsDown
                className="h-3 w-3"
                strokeWidth={2}
                aria-hidden="true"
              />
              {nps.data.detractors}
            </span>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 sm:p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("receivables")}
        </h2>
        <div className="mt-3">
          {receivables.isLoading && <ListSkeleton count={3} />}
          {!receivables.isLoading && receivablesData.length === 0 && (
            <EmptyState
              icon={
                <Inbox
                  className="h-5 w-5 text-[var(--wc-purple)]"
                  strokeWidth={1.75}
                />
              }
              title={t("no_data")}
            />
          )}
          {!receivables.isLoading &&
            receivablesData.map((p) => {
              const canGeneratePix =
                p.status !== "PAID" && Boolean(pixConfig.data?.pixKey);
              return (
                <ListItem
                  key={p.id}
                  title={formatBRL(Number(p.amount))}
                  subtitle={`${formatDate(p.dueDate)}`}
                  right={
                    <div className="flex items-center gap-1.5">
                      {canGeneratePix && (
                        <Button
                          type="button"
                          size="xs"
                          variant="secondary"
                          onClick={() =>
                            generatePix.mutate({ paymentId: p.id })
                          }
                          loading={
                            generatePix.isPending &&
                            generatePix.variables?.paymentId === p.id
                          }
                        >
                          PIX
                        </Button>
                      )}
                      {p.status !== "PAID" && hasMercadoPago && (
                        <Button
                          type="button"
                          size="xs"
                          onClick={() =>
                            generateMpPix.mutate({ paymentId: p.id })
                          }
                          loading={
                            generateMpPix.isPending &&
                            generateMpPix.variables?.paymentId === p.id
                          }
                        >
                          PIX auto
                        </Button>
                      )}
                      <Badge
                        variant={p.status === "PAID" ? "success" : "warning"}
                      >
                        {p.status}
                      </Badge>
                    </div>
                  }
                />
              );
            })}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 sm:p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("expenses")}
        </h2>
        <div className="mt-3">
          {expenses.isLoading && <ListSkeleton count={3} />}
          {!expenses.isLoading && expensesData.length === 0 && (
            <EmptyState
              icon={
                <Banknote
                  className="h-5 w-5 text-[var(--wc-purple)]"
                  strokeWidth={1.75}
                />
              }
              title={t("no_data")}
            />
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

      <PixModal
        code={pixModal?.code ?? null}
        qrCodeBase64={pixModal?.qrBase64 ?? null}
        caption={pixModal?.caption}
        onClose={() => setPixModal(null)}
        onCopied={() => toast.success(tCommon("copied"))}
      />
    </div>
  );
}
