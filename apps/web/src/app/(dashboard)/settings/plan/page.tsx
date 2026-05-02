"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, Badge } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface SessionUserShape {
  plan?: string;
}

export default function PlanPage() {
  const t = useTranslations("platform");
  const tCommon = useTranslations("common");
  const tenantBadge = trpc.platform.getTenantBadge.useQuery();

  // Plan info comes from the JWT today; platform.getSubscription is
  // tracked as a follow-up. Until it lands the page reads what's
  // available on the cached badge query.
  const tenant = tenantBadge.data;

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
        {tenant?.isDemo && <Badge variant="warning">DEMO</Badge>}
        <p className="text-body-small text-[var(--color-text-secondary)]">
          {t("plan_hint")}
        </p>
      </section>

      <Alert variant="ia">
        Detalhes do plano e faturas chegarão quando platform.getSubscription for
        exposto. Tracked em prompts/fase-11/00_PLANO_FASE11.md.
      </Alert>
    </div>
  );
}
