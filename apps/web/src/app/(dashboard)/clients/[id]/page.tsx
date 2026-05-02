"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Avatar,
  Alert,
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  MetricCard,
  Tag,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { WhatsappButton } from "@/components/whatsapp-button";

const BEAUTY_KEYS = [
  "skin_type",
  "hair_type",
  "profession",
  "birthday",
  "allergies",
] as const;

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(d);
}

export default function ClientProfilePage() {
  const t = useTranslations("clients");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const client = trpc.clients.getById.useQuery({ id }, { enabled: !!id });
  const sales = trpc.sales.list.useQuery(
    { page: 1, limit: 100, clientId: id },
    { enabled: !!id },
  );
  const cashback = trpc.sales.getCashbackBalance.useQuery(
    { clientId: id },
    { enabled: !!id },
  );
  const loyalty = trpc.loyalty.getBalance.useQuery(
    { clientId: id },
    { enabled: !!id },
  );

  if (client.isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <ListSkeleton count={4} variant="card" />
      </div>
    );
  }

  if (client.error || !client.data) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        <Link
          href="/clients"
          className="text-body-small text-[var(--color-primary)] hover:underline"
        >
          ← {t("profile_back")}
        </Link>
        <Alert variant="danger">{t("profile_not_found")}</Alert>
      </div>
    );
  }

  const c = client.data;
  const salesData = sales.data?.data ?? [];
  const totalSpent = salesData.reduce(
    (acc, s) => acc + Number(s.total ?? 0),
    0,
  );
  const purchases = salesData.length;
  const avgTicket = purchases > 0 ? totalSpent / purchases : 0;
  const lastPurchase = salesData[0]?.createdAt ?? null;
  const cashbackValue = Number(cashback.data?.available ?? 0);

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
          <Avatar
            name={c.name}
            size="lg"
            classification={c.classification as "A" | "B" | "C" | undefined}
          />
          <div className="space-y-1">
            <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
              {c.name}
            </h1>
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {c.phone}
            </p>
            <div className="flex flex-wrap gap-2">
              {c.isLead && <Badge variant="info">{t("leads")}</Badge>}
              <Tag label={`${t("classification")} ${c.classification}`} />
            </div>
          </div>
        </div>
      </header>

      <section
        aria-label={t("profile_action_more")}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <WhatsappButton clientId={c.id} label={t("profile_action_whatsapp")} />
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
        <MetricCard
          label={t("profile_stat_total_spent")}
          value={formatBRL(totalSpent)}
        />
        <MetricCard
          label={t("profile_stat_purchases")}
          value={String(purchases)}
        />
        <MetricCard
          label={t("profile_stat_avg_ticket")}
          value={formatBRL(avgTicket)}
        />
        <MetricCard
          label={t("profile_stat_engagement")}
          value={String(c.engagementScore ?? 0)}
        />
        <MetricCard
          label={t("profile_stat_last_purchase")}
          value={formatDate(lastPurchase)}
        />
        <MetricCard label={t("cashback")} value={formatBRL(cashbackValue)} />
      </section>

      {c.allergies && (
        <Alert variant="danger" icon="⚠️">
          <strong>{t("profile_allergy_warning")}:</strong> {c.allergies}
        </Alert>
      )}

      {cashbackValue > 0 && (
        <Alert variant="success" icon="💰">
          <strong>{t("profile_cashback_card")}:</strong>{" "}
          {formatBRL(cashbackValue)}
        </Alert>
      )}

      {loyalty.data && (
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-heading-2 text-[var(--color-text-primary)]">
                ⭐ Loyalty
              </h2>
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {loyalty.data.balance} · {loyalty.data.lifetimeEarned}
              </p>
            </div>
            <Link href={`/clients/${id}/loyalty`}>
              <Button type="button" size="sm" variant="ghost">
                →
              </Button>
            </Link>
          </div>
        </section>
      )}

      {c.notes && (
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("profile_consultant_notes")}
          </h2>
          <p className="mt-2 text-body-small italic text-[var(--color-text-secondary)]">
            {c.notes}
          </p>
        </section>
      )}

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("profile_timeline")}
          </h2>
        </div>
        <div className="mt-3">
          {sales.isLoading && <ListSkeleton count={3} />}
          {!sales.isLoading && salesData.length === 0 && (
            <EmptyState icon="🕓" title={t("profile_timeline_empty")} />
          )}
          {!sales.isLoading &&
            salesData
              .slice(0, 5)
              .map((sale) => (
                <ListItem
                  key={sale.id}
                  title={`${t("profile_stat_purchases")} · ${formatBRL(Number(sale.total))}`}
                  subtitle={`${formatDate(sale.createdAt)} · ${sale.status}`}
                />
              ))}
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
          {BEAUTY_KEYS.map((key) => {
            const value =
              key === "skin_type"
                ? c.skinType
                : key === "hair_type"
                  ? c.hairType
                  : key === "profession"
                    ? c.profession
                    : key === "birthday"
                      ? formatDate(c.birthday)
                      : c.allergies;
            return (
              <div
                key={key}
                className="flex items-center justify-between border-b border-[var(--color-border-tertiary)] pb-2 last:border-b-0"
              >
                <dt className="text-caption text-[var(--color-text-tertiary)]">
                  {t(key)}
                </dt>
                <dd className="text-body-small text-[var(--color-text-primary)]">
                  {value || "—"}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
