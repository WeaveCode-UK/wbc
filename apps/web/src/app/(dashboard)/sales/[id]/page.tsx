"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  MetricCard,
} from "@wbc/ui";
import { CreditCard, Receipt } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";
import { PixModal } from "../../../../components/pix-modal";

// F11 follow-up: sale detail page. The /sales list previously had no
// click target — this closes the loop so the consultora can drill in,
// see items + payments, and trigger PIX (static or MP-dynamic) right
// from the sale instead of needing to bounce to /finance.

function formatBRL(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function statusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "DELIVERED":
    case "PAID":
      return "success";
    case "CONFIRMED":
    case "SHIPPED":
      return "info";
    case "DRAFT":
    case "PENDING":
    case "SEPARATED":
      return "warning";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

interface SaleDetail {
  id: string;
  status: string;
  total: number | string;
  paymentMethod?: string | null;
  createdAt: Date | string;
  client?: { id: string; name: string } | null;
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    productName?: string | null;
  }>;
}

interface PaymentRow {
  id: string;
  amount: number | string;
  status: string;
  dueDate?: Date | string | null;
  paidAt?: Date | string | null;
}

export default function SaleDetailPage() {
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const toast = useToast();
  const [pixModal, setPixModal] = useState<{
    code: string;
    qrBase64?: string;
    caption?: string;
  } | null>(null);

  const sale = trpc.sales.getById.useQuery({ id }, { enabled: Boolean(id) });
  const payments = trpc.sales.listPayments.useQuery(
    { saleId: id },
    { enabled: Boolean(id) },
  );
  const pixConfig = trpc.platform.getPixConfig.useQuery();
  const utils = trpc.useUtils();

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
        caption: `PIX automático — confirma sozinho via webhook. Expira ${new Date(result.expiresAt).toLocaleString("pt-BR")}.`,
      });
      void utils.sales.listPayments.invalidate({ saleId: id });
    },
    onError: (err) => toast.error(err.message),
  });

  const hasMercadoPago = Boolean(
    process.env.NEXT_PUBLIC_MERCADOPAGO_ENABLED === "true",
  );

  if (sale.isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        <ListSkeleton count={4} variant="card" />
      </div>
    );
  }

  if (!sale.data) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        <Link
          href="/sales"
          className="text-body-small text-[var(--wc-purple)] hover:underline"
        >
          ← {t("title")}
        </Link>
        <Alert variant="warning">Venda não encontrada.</Alert>
      </div>
    );
  }

  const data = sale.data as unknown as SaleDetail;
  const paymentList = (payments.data ?? []) as unknown as PaymentRow[];
  const itemList = data.items ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/sales"
        className="text-body-small text-[var(--wc-purple)] hover:underline"
      >
        ← {t("title")}
      </Link>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight tabular-nums text-[var(--wc-fg-1)]">
            {formatBRL(data.total)}
          </h1>
          <p className="text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
            {formatDate(data.createdAt)}
            {data.paymentMethod ? ` · ${data.paymentMethod}` : ""}
            {data.client?.name ? ` · ${data.client.name}` : ""}
          </p>
        </div>
        <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
      </header>

      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
        <MetricCard label="Total" value={formatBRL(data.total)} />
        <MetricCard label="Itens" value={String(itemList.length)} />
        <MetricCard label="Parcelas" value={String(paymentList.length)} />
      </div>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-2 sm:p-4">
        <h2 className="px-2 text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Itens
        </h2>
        {itemList.length === 0 ? (
          <EmptyState
            icon={
              <Receipt
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title="Sem itens"
          />
        ) : (
          itemList.map((it) => (
            <ListItem
              key={it.id}
              title={it.productName ?? "Item"}
              subtitle={`${it.quantity} × ${formatBRL(it.unitPrice)}`}
              right={
                <span className="text-body-small font-medium text-[var(--wc-fg-1)]">
                  {formatBRL(Number(it.unitPrice) * it.quantity)}
                </span>
              }
            />
          ))
        )}
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-2 sm:p-4">
        <h2 className="px-2 text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Cobranças
        </h2>
        {payments.isLoading && <ListSkeleton count={2} />}
        {!payments.isLoading && paymentList.length === 0 && (
          <EmptyState
            icon={
              <CreditCard
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title="Sem cobranças"
          />
        )}
        {!payments.isLoading &&
          paymentList.map((p) => {
            const isPending = p.status !== "PAID" && p.status !== "CANCELLED";
            const canGenerateStatic =
              isPending && Boolean(pixConfig.data?.pixKey);
            return (
              <ListItem
                key={p.id}
                title={formatBRL(p.amount)}
                subtitle={
                  p.status === "PAID"
                    ? `Pago em ${formatDate(p.paidAt)}`
                    : `Vence ${formatDate(p.dueDate)}`
                }
                right={
                  <div className="flex flex-wrap items-center gap-1.5">
                    {canGenerateStatic && (
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={() => generatePix.mutate({ paymentId: p.id })}
                        loading={
                          generatePix.isPending &&
                          generatePix.variables?.paymentId === p.id
                        }
                      >
                        PIX
                      </Button>
                    )}
                    {isPending && hasMercadoPago && (
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
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </div>
                }
              />
            );
          })}
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
