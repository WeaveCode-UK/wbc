"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input, MetricCard, SegmentedControl } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

type Mode = "campaign" | "billing" | "reactivation" | "correction";

export default function AiPage() {
  const tCommon = useTranslations("common");
  const [mode, setMode] = useState<Mode>("campaign");
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  const usage = trpc.ai.getUsage.useQuery();
  const campaign = trpc.ai.generateCampaignText.useMutation({
    onSuccess: (r) => setOutput(r.text),
  });
  const billing = trpc.ai.generateBillingMessage.useMutation({
    onSuccess: (r) => setOutput(r.text),
  });
  const reactivation = trpc.ai.generateReactivation.useMutation({
    onSuccess: (r) => setOutput(r.text),
  });
  const correct = trpc.ai.correctText.useMutation({
    onSuccess: (r) => setOutput(r.correctedText),
  });

  const isPending =
    campaign.isPending ||
    billing.isPending ||
    reactivation.isPending ||
    correct.isPending;
  const error =
    campaign.error ?? billing.error ?? reactivation.error ?? correct.error;

  const onGenerate = () => {
    if (!text) return;
    setOutput("");
    if (mode === "campaign") campaign.mutate({ objective: text });
    else if (mode === "billing")
      billing.mutate({
        clientName: "Cliente",
        amount: 0,
        dueDate: text,
      });
    else if (mode === "reactivation")
      reactivation.mutate({
        clientName: "Cliente",
        lastPurchaseDate: text,
      });
    else correct.mutate({ text });
  };

  const used = usage.data?.used ?? 0;
  const limit = usage.data?.limit ?? 30;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        ✨ IA
      </h1>

      <MetricCard label="Gerações no mês" value={`${used} / ${limit}`} />

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        options={[
          { value: "campaign", label: "Campanha" },
          { value: "billing", label: "Cobrança" },
          { value: "reactivation", label: "Reativação" },
          { value: "correction", label: "Corrigir" },
        ]}
      />

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            mode === "campaign"
              ? "Objetivo da campanha"
              : mode === "billing"
                ? "Vencimento (ex: 2026-05-15)"
                : mode === "reactivation"
                  ? "Última compra (ex: 2026-01-10)"
                  : "Texto para corrigir"
          }
          className="w-full min-h-[120px] rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 text-body-small text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        {error && <Alert variant="danger">{error.message}</Alert>}
        <Button
          type="button"
          onClick={onGenerate}
          disabled={isPending || !text || used >= limit}
        >
          {isPending ? "..." : tCommon("create")}
        </Button>
      </section>

      {output && (
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-primary-surface)] p-4 space-y-2">
          <p className="text-body-small text-[var(--color-text-primary)] whitespace-pre-line">
            {output}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(output)}
          >
            {tCommon("copy")}
          </Button>
        </section>
      )}
    </div>
  );
}
