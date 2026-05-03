"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, ToggleSwitch } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11.E14 + follow-up: post-sale 2+2+2 flow config. Persistence is
// now wired to messaging.getPostSaleConfig / updatePostSaleConfig
// (Tenant table — see migration in this commit). The worker reads
// the same fields when scheduling outgoing messages.

export default function PostSalePage() {
  const t = useTranslations("messaging");
  const toast = useToast();
  const config = trpc.messaging.getPostSaleConfig.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.messaging.updatePostSaleConfig.useMutation({
    onSuccess: () => {
      toast.success("Cadência salva");
      void utils.messaging.getPostSaleConfig.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [enabled, setEnabled] = useState(true);
  const [delays, setDelays] = useState({ d2: 2, w2: 14, m2: 60 });

  useEffect(() => {
    if (!config.data) return;
    setEnabled(config.data.postSaleEnabled);
    setDelays({
      d2: config.data.postSaleDayDelay,
      w2: config.data.postSaleWeekDelay,
      m2: config.data.postSaleMonthDelay,
    });
  }, [config.data]);

  const save = () => {
    update.mutate({
      enabled,
      dayDelay: delays.d2,
      weekDelay: delays.w2,
      monthDelay: delays.m2,
    });
  };

  const isDirty =
    config.data &&
    (config.data.postSaleEnabled !== enabled ||
      config.data.postSaleDayDelay !== delays.d2 ||
      config.data.postSaleWeekDelay !== delays.w2 ||
      config.data.postSaleMonthDelay !== delays.m2);

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        Pós-venda 2+2+2
      </h1>

      <Alert variant="ia">
        Mensagem 2 dias depois da entrega → 2 semanas → 2 meses, na cadência
        configurada abaixo.
      </Alert>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-4 space-y-3 shadow-wc-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              Fluxo ativo
            </h2>
            <p className="text-caption text-[var(--wc-fg-3)]">
              {t("post_sale_subtitle")}
            </p>
          </div>
          <ToggleSwitch checked={enabled} onChange={setEnabled} />
        </div>
      </section>

      {enabled && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-4 space-y-3 shadow-wc-xs">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Cadência (em dias)
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "d2", label: "1ª mensagem" },
                { key: "w2", label: "2ª mensagem" },
                { key: "m2", label: "3ª mensagem" },
              ] as const
            ).map((opt) => (
              <label key={opt.key} className="space-y-1">
                <span className="text-caption text-[var(--wc-fg-3)]">
                  {opt.label}
                </span>
                <input
                  type="number"
                  min={1}
                  value={delays[opt.key]}
                  onChange={(e) =>
                    setDelays((prev) => ({
                      ...prev,
                      [opt.key]: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 text-body-small text-[var(--wc-fg-1)] focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)]"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={save}
          loading={update.isPending}
          disabled={!isDirty || update.isPending}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
