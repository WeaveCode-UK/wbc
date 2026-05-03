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
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        Indique e ganhe
      </h1>

      {referral.isLoading && <Alert variant="ia">{tCommon("loading")}</Alert>}

      {!referral.isLoading && (!data || !data.code) && (
        <EmptyState
          title="Sem código de indicação"
          description="Seu código será gerado quando o programa de indicação for ativado."
        />
      )}

      {data?.code && (
        <>
          <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-6 text-center space-y-3">
            <p className="text-[12px] text-[var(--wc-fg-3)]">Seu código</p>
            <p
              className="text-[24px] font-semibold tracking-wider text-[var(--wc-purple)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data.code}
            </p>
            <p className="text-[13px] text-[var(--wc-fg-2)] break-all">
              {data.link}
            </p>
            <Button type="button" size="sm" onClick={onCopy}>
              {tCommon("copy")}
            </Button>
          </section>

          <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              Estatísticas
            </h2>
            <p className="mt-2 text-[13px] text-[var(--wc-fg-2)]">
              {data.stats?.used ?? 0} indicações utilizaram seu código.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
