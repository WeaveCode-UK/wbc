"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, Badge } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export default function PlanPage() {
  const t = useTranslations("platform");
  const tCommon = useTranslations("common");
  const tenantBadge = trpc.platform.getTenantBadge.useQuery();
  // F11.E26: real subscription details (replaces the JWT-only fallback).
  const subscription = trpc.platform.getSubscription.useQuery();

  const tenant = tenantBadge.data;
  const sub = subscription.data;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/settings"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        {t("plan")}
      </h1>

      <section className="rounded-wc-lg border border-[var(--wc-purple)] ring-1 ring-[var(--wc-purple)]/20 bg-white shadow-wc-md p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            {tenant?.name ?? "—"}
          </h2>
          <span
            className="font-serif italic text-[14px] text-[var(--wc-purple)]"
            aria-hidden="true"
          >
            {"{recommended}"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tenant?.isDemo && <Badge variant="warning">DEMO</Badge>}
          {sub?.plan && <Badge variant="info">{sub.plan}</Badge>}
          {sub?.status && (
            <Badge variant={sub.status === "ACTIVE" ? "success" : "warning"}>
              {sub.status}
            </Badge>
          )}
        </div>
        <p className="text-[13px] text-[var(--wc-fg-2)]">{t("plan_hint")}</p>
      </section>

      {subscription.isLoading && (
        <Alert variant="ia">Carregando detalhes do plano…</Alert>
      )}

      {sub && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-6 space-y-3">
          <h3 className="text-[15px] font-medium text-[var(--wc-fg-1)]">
            Ciclo atual
          </h3>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-[13px]">
            <div>
              <dt className="text-[12px] text-[var(--wc-fg-3)]">Início</dt>
              <dd className="text-[var(--wc-fg-1)]">
                {formatDate(sub.startsAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--wc-fg-3)]">
                Próxima cobrança
              </dt>
              <dd className="text-[var(--wc-fg-1)]">
                {formatDate(sub.billingCycleEnd ?? sub.expiresAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--wc-fg-3)]">
                Gerações de IA
              </dt>
              <dd className="text-[var(--wc-fg-1)]">
                {sub.aiGenerationsUsed} / {sub.aiGenerationsLimit}
              </dd>
            </div>
            {sub.monthlyCostBudgetUSD != null && (
              <div>
                <dt className="text-[12px] text-[var(--wc-fg-3)]">
                  Custo mensal IA
                </dt>
                <dd className="text-[var(--wc-fg-1)]">
                  US$ {Number(sub.monthlyCostAccumulatedUSD ?? 0).toFixed(2)} /{" "}
                  US$ {Number(sub.monthlyCostBudgetUSD).toFixed(2)}
                </dd>
              </div>
            )}
          </dl>
          {sub.monthlyCostBlockedAt && (
            <Alert variant="danger">
              Conta bloqueada para uso de IA por exceder o orçamento mensal.
            </Alert>
          )}
        </section>
      )}

      {!sub && !subscription.isLoading && (
        <Alert variant="warning">
          Nenhuma assinatura ativa encontrada para este tenant.
        </Alert>
      )}
    </div>
  );
}
