"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, MetricCard } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

// F11.E21: FunnelChart is the heaviest UI primitive in the bundle
// (custom SVG + animation logic). Only this single page renders it,
// so loading it on demand keeps it out of the shared chunks.
const FunnelChart = dynamic(
  () => import("@wbc/ui").then((m) => ({ default: m.FunnelChart })),
  { ssr: false },
);

type Segment = "NO_RECEIVE" | "NO_VIEW" | "NO_RESPONSE";

const STAT_KEYS = [
  "stats_sent",
  "stats_received",
  "stats_viewed",
  "stats_responded",
] as const;

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CampaignDetailPage() {
  const t = useTranslations("campaigns");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [remarketingError, setRemarketingError] = useState<string | null>(null);

  // F11.E26: real campaign + recipient counts + conversion stats.
  const detail = trpc.campaigns.getById.useQuery(
    { id },
    { enabled: Boolean(id) },
  );
  const conversion = trpc.sales.getConversionStats.useQuery(
    { campaignId: id },
    { enabled: Boolean(id) },
  );

  const remarketing = trpc.campaigns.createRemarketing.useMutation({
    onSuccess: (created) => {
      router.push(`/campaigns/${created.id}`);
    },
    onError: (err) => setRemarketingError(err.message),
  });

  const triggerRemarketing = (segment: Segment) => {
    setRemarketingError(null);
    remarketing.mutate({ sourceCampaignId: id, segment });
  };

  const counts = detail.data?.counts;
  const sentTotal =
    (counts?.sent ?? 0) +
    (counts?.received ?? 0) +
    (counts?.viewed ?? 0) +
    (counts?.replied ?? 0);
  const stats = {
    sent: sentTotal,
    received:
      (counts?.received ?? 0) + (counts?.viewed ?? 0) + (counts?.replied ?? 0),
    viewed: (counts?.viewed ?? 0) + (counts?.replied ?? 0),
    responded: counts?.replied ?? 0,
    purchased: conversion.data?.purchased ?? 0,
  };
  const revenue = conversion.data?.revenue ?? 0;
  const conversionRate = conversion.data?.conversion ?? 0;

  const funnelSteps = [
    {
      label: t("stats_sent"),
      value: stats.sent,
      color: "var(--color-primary)",
    },
    {
      label: t("stats_received"),
      value: stats.received,
      color: "var(--color-info-text)",
    },
    {
      label: t("stats_viewed"),
      value: stats.viewed,
      color: "var(--color-warning-text)",
    },
    {
      label: t("stats_responded"),
      value: stats.responded,
      color: "var(--color-success-text)",
    },
    {
      label: t("stats_purchased"),
      value: stats.purchased,
      color: "var(--color-danger-text)",
    },
  ];

  const notFound = detail.isFetched && !detail.data;
  const campaign = detail.data?.campaign;

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/campaigns"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {t("back_to_list")}
      </Link>

      <header>
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {notFound ? t("campaign_not_found") : (campaign?.name ?? "—")}
        </h1>
        <p className="text-caption text-[var(--color-text-tertiary)]">
          ID: {id}
        </p>
      </header>

      <section
        aria-label={t("funnel_title")}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {STAT_KEYS.map((key) => {
          const v =
            key === "stats_sent"
              ? stats.sent
              : key === "stats_received"
                ? stats.received
                : key === "stats_viewed"
                  ? stats.viewed
                  : stats.responded;
          return <MetricCard key={key} label={t(key)} value={String(v)} />;
        })}
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("funnel_title")}
        </h2>
        <FunnelChart steps={funnelSteps} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard label={t("result_revenue")} value={formatBRL(revenue)} />
        <MetricCard
          label={t("result_conversion")}
          value={`${(conversionRate * 100).toFixed(1)}%`}
        />
      </section>

      <section className="rounded-lg border border-[var(--color-warning-text)] bg-[var(--color-warning-bg)] p-4 space-y-2">
        <p className="text-body-small text-[var(--color-warning-text)]">
          {t("remarketing_cta")}
        </p>
        {remarketingError && <Alert variant="danger">{remarketingError}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => triggerRemarketing("NO_RECEIVE")}
            disabled={remarketing.isPending}
          >
            {t("negative_no_receive")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => triggerRemarketing("NO_VIEW")}
            disabled={remarketing.isPending}
          >
            {t("negative_no_view")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => triggerRemarketing("NO_RESPONSE")}
            disabled={remarketing.isPending}
          >
            {t("negative_no_response")}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("negative_lists")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--color-danger-text)] bg-[var(--color-danger-bg)] px-3 py-1 text-caption text-[var(--color-danger-text)] hover:bg-[var(--color-bg-primary)]"
          >
            {t("negative_no_receive")}
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--color-warning-text)] bg-[var(--color-warning-bg)] px-3 py-1 text-caption text-[var(--color-warning-text)] hover:bg-[var(--color-bg-primary)]"
          >
            {t("negative_no_view")}
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] px-3 py-1 text-caption text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)]"
          >
            {t("negative_no_response")}
          </button>
        </div>
      </section>
    </div>
  );
}
