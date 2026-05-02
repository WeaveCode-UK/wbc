"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  SegmentedControl,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

type StatusFilter =
  | "all"
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "CANCELLED";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

function statusVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "SENT":
      return "success";
    case "SENDING":
      return "info";
    case "SCHEDULED":
      return "warning";
    case "DRAFT":
      return "neutral";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

export default function CampaignsPage() {
  const t = useTranslations("campaigns");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const list = trpc.campaigns.list.useQuery({
    page: 1,
    limit: 50,
    status: filter === "all" ? undefined : filter,
  });

  const data = list.data?.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Link href="/campaigns/new">
          <Button type="button" size="sm">
            {t("new_campaign")}
          </Button>
        </Link>
      </div>

      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as StatusFilter)}
        options={[
          { value: "all", label: t("title") },
          { value: "DRAFT", label: t("status") },
          { value: "SCHEDULED", label: t("schedule") },
          { value: "SENT", label: t("send_now") },
        ]}
      />

      <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={4} />}

        {!list.isLoading && data.length === 0 && (
          <EmptyState
            icon="📣"
            title={t("no_campaigns")}
            description={t("no_campaigns_hint")}
            action={
              <Link href="/campaigns/new">
                <Button type="button" size="sm">
                  {t("new_campaign")}
                </Button>
              </Link>
            }
          />
        )}

        {!list.isLoading &&
          data.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <ListItem
                title={c.name}
                subtitle={`${formatDate(c.scheduledAt ?? c.createdAt)}`}
                right={
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                }
              />
            </Link>
          ))}
      </div>
    </div>
  );
}
