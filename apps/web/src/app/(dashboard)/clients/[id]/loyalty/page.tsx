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
  Input,
  ListItem,
  ListSkeleton,
  MetricCard,
} from "@wbc/ui";
import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function kindVariant(
  kind: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (kind) {
    case "EARN":
      return "success";
    case "REDEEM":
      return "info";
    case "EXPIRE":
      return "danger";
    case "ADJUST":
      return "warning";
    default:
      return "neutral";
  }
}

export default function LoyaltyExtractPage() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [redeemAmount, setRedeemAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const balance = trpc.loyalty.getBalance.useQuery(
    { clientId: id },
    { enabled: !!id },
  );
  const statement = trpc.loyalty.getStatement.useQuery(
    { clientId: id, limit: 100 },
    { enabled: !!id },
  );
  const utils = trpc.useUtils();
  const redeem = trpc.loyalty.redeem.useMutation({
    onSuccess: () => {
      setRedeemAmount("");
      setNotice(tCommon("save"));
      void utils.loyalty.getBalance.invalidate({ clientId: id });
      void utils.loyalty.getStatement.invalidate({ clientId: id });
    },
    onError: (err) => setNotice(err.message),
  });

  const balanceValue = balance.data?.balance ?? 0;
  const lifetime = balance.data?.lifetimeEarned ?? 0;
  const rows = statement.data ?? [];

  const onRedeem = () => {
    const points = Number(redeemAmount);
    if (!Number.isFinite(points) || points <= 0) return;
    setNotice(null);
    redeem.mutate({ clientId: id, points });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href={`/clients/${id}`}
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {t("profile_back")}
      </Link>

      <header>
        <h1 className="flex items-center gap-2 text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          <Star
            className="h-6 w-6 text-[var(--wc-orange)]"
            strokeWidth={1.75}
          />
          Loyalty
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label={t("cashback")} value={String(balanceValue)} />
        <MetricCard
          label={t("profile_stat_total_spent")}
          value={String(lifetime)}
        />
      </div>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-4 space-y-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("profile_cashback_remind")}
        </h2>
        {notice && (
          <Alert variant={redeem.error ? "danger" : "success"}>{notice}</Alert>
        )}
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={balanceValue}
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder="0"
          />
          <Button
            type="button"
            onClick={onRedeem}
            loading={redeem.isPending}
            disabled={
              redeem.isPending ||
              balanceValue === 0 ||
              !redeemAmount ||
              Number(redeemAmount) > balanceValue
            }
          >
            {tCommon("confirm")}
          </Button>
        </div>
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-4 space-y-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("profile_timeline")}
        </h2>
        {statement.isLoading && <ListSkeleton count={4} />}
        {!statement.isLoading && rows.length === 0 && (
          <EmptyState
            icon={
              <Star
                className="h-5 w-5 text-[var(--wc-orange)]"
                strokeWidth={1.75}
              />
            }
            title={t("profile_timeline_empty")}
          />
        )}
        {!statement.isLoading &&
          rows.map((row) => (
            <ListItem
              key={row.id}
              title={`${row.amount > 0 ? "+" : ""}${row.amount}`}
              subtitle={`${formatDate(row.createdAt)}${row.note ? ` · ${row.note}` : ""}`}
              right={<Badge variant={kindVariant(row.kind)}>{row.kind}</Badge>}
            />
          ))}
      </section>
    </div>
  );
}
