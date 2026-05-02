"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EmptyState, Skeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function DashboardPage() {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const dashboard = trpc.analytics.getDashboard.useQuery();

  const goNewSale = () => router.push("/sales/new");
  const goNewClient = () => router.push("/clients");
  const goSendMessage = () => router.push("/campaigns/new");
  const goAskAi = () => router.push("/campaigns/new");

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("greeting_morning")
      : hour < 18
        ? t("greeting_afternoon")
        : t("greeting_evening");

  const data = dashboard.data;
  const isLoading = dashboard.isLoading;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {tCommon("nav_my_day")}
        </h1>
        <p className="mt-1 text-body-small sm:text-body text-[var(--color-text-secondary)]">
          {greeting}! <span aria-hidden="true">👋</span>
        </p>
        <p className="mt-0.5 text-caption text-[var(--color-text-tertiary)]">
          {t("summary")}
        </p>
      </header>

      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 sm:p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {t("sales_month")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p
              className="text-heading-3 sm:text-heading-2 text-[var(--color-text-primary)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data?.salesThisMonth ?? 0}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 sm:p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {t("revenue")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p
              className="text-heading-3 sm:text-heading-2 text-[var(--color-text-primary)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatBRL(Number(data?.revenue ?? 0))}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 sm:p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {t("reminders")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p
              className="text-heading-3 sm:text-heading-2 text-[var(--color-text-primary)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data?.pendingReminders ?? 0}
            </p>
          )}
          {(data?.pendingReminders ?? 0) > 0 && (
            <p className="text-caption text-[var(--color-warning)]">
              {t("pending")}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-3 sm:p-4 space-y-1">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {t("today")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p
              className="text-heading-3 sm:text-heading-2 text-[var(--color-text-primary)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data?.upcomingAppointments ?? 0}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] p-4 sm:p-5 space-y-4">
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">
            {t("quick_actions")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={goNewSale}
              aria-label={t("new_sale")}
              className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-all duration-150 active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg"
              >
                +
              </span>
              {t("new_sale")}
            </button>
            <button
              type="button"
              onClick={goNewClient}
              aria-label={t("new_client")}
              className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-all duration-150 active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg"
              >
                👤
              </span>
              {t("new_client")}
            </button>
            <button
              type="button"
              onClick={goSendMessage}
              aria-label={t("send_message")}
              className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-all duration-150 active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg"
              >
                💬
              </span>
              {t("send_message")}
            </button>
            <button
              type="button"
              onClick={goAskAi}
              aria-label={t("ask_ai")}
              className="flex items-center gap-3 rounded-md bg-[var(--color-primary-surface)] p-3 text-body-small text-[var(--color-primary)] hover:bg-[var(--color-primary-surface-hover)] transition-all duration-150 active:scale-[0.98] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary)] text-white text-lg"
              >
                ✨
              </span>
              {t("ask_ai")}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] p-4 sm:p-5 space-y-4">
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">
            {t("today")}
          </h2>
          <EmptyState
            icon="📅"
            title={t("summary")}
            description={t("pending")}
          />
        </div>
      </div>
    </div>
  );
}
