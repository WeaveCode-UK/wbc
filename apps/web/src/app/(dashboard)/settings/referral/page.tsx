"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, Button, EmptyState } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface ReferralPayload {
  code: string;
  link: string;
  stats: { used: number };
}

export default function ReferralPage() {
  const tCommon = useTranslations("common");
  const referral = trpc.platform.getReferralCode.useQuery();
  const data = referral.data as ReferralPayload | undefined;

  const onCopy = () => {
    if (!data?.link) return;
    navigator.clipboard.writeText(data.link);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/settings"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        💜 Indique e ganhe
      </h1>

      {referral.isLoading && <Alert variant="ia">{tCommon("loading")}</Alert>}

      {!referral.isLoading && (!data || !data.code) && (
        <EmptyState
          icon="🎁"
          title="Sem código de indicação"
          description="Seu código será gerado quando o programa de indicação for ativado."
        />
      )}

      {data?.code && (
        <>
          <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 text-center space-y-3">
            <p className="text-caption text-[var(--color-text-tertiary)]">
              Seu código
            </p>
            <p
              className="text-heading-1 text-[var(--color-primary)] tracking-wider"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data.code}
            </p>
            <p className="text-body-small text-[var(--color-text-secondary)] break-all">
              {data.link}
            </p>
            <Button type="button" size="sm" onClick={onCopy}>
              {tCommon("copy")}
            </Button>
          </section>

          <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              Estatísticas
            </h2>
            <p className="mt-2 text-body-small text-[var(--color-text-secondary)]">
              {data.stats?.used ?? 0} indicações utilizaram seu código.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
