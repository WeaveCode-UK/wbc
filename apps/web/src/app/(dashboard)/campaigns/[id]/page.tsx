"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, FunnelChart, MetricCard } from "@wbc/ui";

const STAT_KEYS = [
  "stats_sent",
  "stats_received",
  "stats_viewed",
  "stats_responded",
] as const;

export default function CampaignDetailPage() {
  const t = useTranslations("campaigns");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const funnelSteps = [
    {
      label: t("stats_sent"),
      value: 0,
      color: "var(--color-primary)",
    },
    {
      label: t("stats_received"),
      value: 0,
      color: "var(--color-info-text)",
    },
    {
      label: t("stats_viewed"),
      value: 0,
      color: "var(--color-warning-text)",
    },
    {
      label: t("stats_responded"),
      value: 0,
      color: "var(--color-success-text)",
    },
    {
      label: t("stats_purchased"),
      value: 0,
      color: "var(--color-danger-text)",
    },
  ];

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
          {t("campaign_not_found")}
        </h1>
        <p className="text-caption text-[var(--color-text-tertiary)]">
          ID: {id}
        </p>
      </header>

      <section
        aria-label={t("funnel_title")}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {STAT_KEYS.map((key) => (
          <MetricCard key={key} label={t(key)} value="—" />
        ))}
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("funnel_title")}
        </h2>
        <FunnelChart steps={funnelSteps} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard label={t("result_revenue")} value="R$ —" />
        <MetricCard label={t("result_conversion")} value="—%" />
      </section>

      <section className="rounded-lg border border-[var(--color-warning-text)] bg-[var(--color-warning-bg)] p-4">
        <p className="text-body-small text-[var(--color-warning-text)]">
          {t("remarketing_cta")}
        </p>
        <Button type="button" variant="secondary" className="mt-3">
          {t("new_campaign")}
        </Button>
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
