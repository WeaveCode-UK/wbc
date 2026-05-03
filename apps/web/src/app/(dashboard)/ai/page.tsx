"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input, MetricCard, SegmentedControl } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

type Mode = "campaign" | "billing" | "reactivation" | "correction";

export default function AiPage() {
  const tCommon = useTranslations("common");
  const t = useTranslations("ai");
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
      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        {t("title")}{" "}
        <em className="font-serif italic font-normal text-[var(--wc-purple)]">{`{copilot}`}</em>
      </h1>

      <MetricCard label={t("monthly_usage")} value={`${used} / ${limit}`} />

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        options={[
          { value: "campaign", label: t("mode_campaign") },
          { value: "billing", label: t("mode_billing") },
          { value: "reactivation", label: t("mode_reactivation") },
          { value: "correction", label: t("mode_correction") },
        ]}
      />

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            mode === "campaign"
              ? t("input_placeholder_campaign")
              : mode === "billing"
                ? t("input_placeholder_billing")
                : mode === "reactivation"
                  ? t("input_placeholder_reactivation")
                  : t("input_placeholder_correction")
          }
          className="w-full min-h-[120px] rounded-md border border-[var(--wc-border)] bg-white p-3 text-[13px] text-[var(--wc-fg-1)] focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)]"
        />
        {error && <Alert variant="danger">{error.message}</Alert>}
        <Button
          type="button"
          onClick={onGenerate}
          loading={isPending}
          disabled={isPending || !text || used >= limit}
        >
          {tCommon("create")}
        </Button>
      </section>

      {output && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-purple-50)] p-5 space-y-2">
          <p className="text-[13px] text-[var(--wc-fg-1)] whitespace-pre-line">
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
