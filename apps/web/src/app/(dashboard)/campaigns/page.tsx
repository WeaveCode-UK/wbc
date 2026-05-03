"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Megaphone } from "lucide-react";
import {
  Alert,
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
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const list = trpc.campaigns.list.useQuery({
    page: 1,
    limit: 50,
    status: filter === "all" ? undefined : filter,
  });
  const features = trpc.platform.getUnlockedFeatures.useQuery();
  const campaignsLocked = features.data
    ? !features.data.unlockedFeatures.includes("campaigns")
    : false;

  const data = list.data?.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("title")}
        </h1>
        <Button
          type="button"
          size="sm"
          onClick={() => router.push("/campaigns/new")}
        >
          {t("new_campaign")}
        </Button>
      </div>

      {campaignsLocked && (
        <Alert
          variant="warning"
          icon={<Lock className="h-4 w-4" strokeWidth={1.75} />}
        >
          {t("no_campaigns_hint")}
        </Alert>
      )}

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

      <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 sm:p-4 shadow-wc-xs">
        {list.isLoading && <ListSkeleton count={4} />}

        {!list.isLoading && data.length === 0 && (
          <EmptyState
            icon={
              <Megaphone
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
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
