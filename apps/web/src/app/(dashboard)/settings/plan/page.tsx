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
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        {t("plan")}
      </h1>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {tenant?.name ?? "—"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {tenant?.isDemo && <Badge variant="warning">DEMO</Badge>}
          {sub?.plan && <Badge variant="info">{sub.plan}</Badge>}
          {sub?.status && (
            <Badge variant={sub.status === "ACTIVE" ? "success" : "warning"}>
              {sub.status}
            </Badge>
          )}
        </div>
        <p className="text-body-small text-[var(--color-text-secondary)]">
          {t("plan_hint")}
        </p>
      </section>

      {subscription.isLoading && (
        <Alert variant="ia">Carregando detalhes do plano…</Alert>
      )}

      {sub && (
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
          <h3 className="text-heading-3 text-[var(--color-text-primary)]">
            Ciclo atual
          </h3>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-body-small">
            <div>
              <dt className="text-caption text-[var(--color-text-tertiary)]">
                Início
              </dt>
              <dd className="text-[var(--color-text-primary)]">
                {formatDate(sub.startsAt)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-[var(--color-text-tertiary)]">
                Próxima cobrança
              </dt>
              <dd className="text-[var(--color-text-primary)]">
                {formatDate(sub.billingCycleEnd ?? sub.expiresAt)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-[var(--color-text-tertiary)]">
                Gerações de IA
              </dt>
              <dd className="text-[var(--color-text-primary)]">
                {sub.aiGenerationsUsed} / {sub.aiGenerationsLimit}
              </dd>
            </div>
            {sub.monthlyCostBudgetUSD != null && (
              <div>
                <dt className="text-caption text-[var(--color-text-tertiary)]">
                  Custo mensal IA
                </dt>
                <dd className="text-[var(--color-text-primary)]">
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
