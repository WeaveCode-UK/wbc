"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar, Badge, Button, EmptyState, MetricCard, Tag } from "@wbc/ui";

const STATS_KEYS = [
  "profile_stat_total_spent",
  "profile_stat_purchases",
  "profile_stat_avg_ticket",
  "profile_stat_frequency",
  "profile_stat_engagement",
  "profile_stat_last_purchase",
] as const;

const BEAUTY_KEYS = [
  "skin_type",
  "hair_type",
  "profession",
  "birthday",
  "allergies",
  "tags",
] as const;

export default function ClientProfilePage() {
  const t = useTranslations("clients");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/clients"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {t("profile_back")}
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name="?" size="lg" />
          <div className="space-y-1">
            <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
              {t("profile_not_found")}
            </h1>
            <p className="text-caption text-[var(--color-text-tertiary)]">
              ID: {id}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">VIP</Badge>
              <Tag label={`${t("classification")} A`} />
            </div>
          </div>
        </div>
      </header>

      <section
        aria-label={t("profile_action_more")}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <Button type="button" variant="secondary">
          {t("profile_action_whatsapp")}
        </Button>
        <Button type="button">{t("profile_action_sell")}</Button>
        <Button type="button" variant="secondary">
          {t("profile_action_schedule")}
        </Button>
        <Button type="button" variant="ghost">
          {t("profile_action_more")}
        </Button>
      </section>

      <section
        aria-label="stats"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {STATS_KEYS.map((key) => (
          <MetricCard key={key} label={t(key)} value="—" />
        ))}
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("profile_consultant_notes")}
        </h2>
        <p className="mt-2 text-body-small italic text-[var(--color-text-secondary)]">
          —
        </p>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("profile_timeline")}
          </h2>
          <button
            type="button"
            className="text-body-small text-[var(--color-primary)] hover:underline"
          >
            {t("profile_timeline_view_all")}
          </button>
        </div>
        <div className="mt-3">
          <EmptyState icon="🕓" title={t("profile_timeline_empty")} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("profile_wishlist")}
          </h2>
          <Button type="button" size="sm" variant="ghost">
            {t("profile_wishlist_add")}
          </Button>
        </div>
        <div className="mt-3">
          <EmptyState icon="🎁" title={t("profile_wishlist_empty")} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("profile_beauty")}
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BEAUTY_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-[var(--color-border-tertiary)] pb-2 last:border-b-0"
            >
              <dt className="text-caption text-[var(--color-text-tertiary)]">
                {t(key)}
              </dt>
              <dd className="text-body-small text-[var(--color-text-primary)]">
                —
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
