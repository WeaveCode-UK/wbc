"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Calendar,
  MessageSquare,
  Plus,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { EmptyState, Skeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { OnboardingChecklist } from "../../components/onboarding-checklist";

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

  const quickActions = [
    { label: t("new_sale"), Icon: Plus, onClick: goNewSale },
    { label: t("new_client"), Icon: UserPlus, onClick: goNewClient },
    { label: t("send_message"), Icon: MessageSquare, onClick: goSendMessage },
    { label: t("ask_ai"), Icon: Sparkles, onClick: goAskAi },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {tCommon("nav_my_day")}
        </h1>
        <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          {greeting}.
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--wc-fg-3)]">
          {t("summary")}
        </p>
      </header>

      <OnboardingChecklist />

      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-wc-lg bg-[var(--wc-bg-elevated)] border border-[var(--wc-border)] p-4 sm:p-5 space-y-1 shadow-wc-xs">
          <p className="text-[10px] uppercase tracking-[0.06em] font-medium text-[var(--wc-fg-3)]">
            {t("sales_month")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p
              className="text-[20px] sm:text-[26px] font-semibold tracking-tight text-[var(--wc-fg-1)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data?.salesThisMonth ?? 0}
            </p>
          )}
        </div>
        <div className="rounded-wc-lg bg-[var(--wc-bg-elevated)] border border-[var(--wc-border)] p-4 sm:p-5 space-y-1 shadow-wc-xs">
          <p className="text-[10px] uppercase tracking-[0.06em] font-medium text-[var(--wc-fg-3)]">
            {t("revenue")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p
              className="text-[20px] sm:text-[26px] font-semibold tracking-tight text-[var(--wc-fg-1)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatBRL(Number(data?.revenue ?? 0))}
            </p>
          )}
        </div>
        <div className="rounded-wc-lg bg-[var(--wc-bg-elevated)] border border-[var(--wc-border)] p-4 sm:p-5 space-y-1 shadow-wc-xs">
          <p className="text-[10px] uppercase tracking-[0.06em] font-medium text-[var(--wc-fg-3)]">
            {t("reminders")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p
              className="text-[20px] sm:text-[26px] font-semibold tracking-tight text-[var(--wc-fg-1)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data?.pendingReminders ?? 0}
            </p>
          )}
          {(data?.pendingReminders ?? 0) > 0 && (
            <p className="text-[11px] font-medium text-[var(--wc-warning)]">
              {t("pending")}
            </p>
          )}
        </div>
        <div className="rounded-wc-lg bg-[var(--wc-bg-elevated)] border border-[var(--wc-border)] p-4 sm:p-5 space-y-1 shadow-wc-xs">
          <p className="text-[10px] uppercase tracking-[0.06em] font-medium text-[var(--wc-fg-3)]">
            {t("today")}
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p
              className="text-[20px] sm:text-[26px] font-semibold tracking-tight text-[var(--wc-fg-1)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {data?.upcomingAppointments ?? 0}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-wc-lg bg-[var(--wc-bg-elevated)] border border-[var(--wc-border)] p-4 sm:p-5 space-y-4 shadow-wc-xs">
          <h2 className="text-[15px] font-medium text-[var(--wc-fg-1)]">
            {t("quick_actions")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                aria-label={label}
                className="flex items-center gap-3 rounded-wc-sm bg-[var(--wc-purple-50)] p-3 text-[13px] font-medium text-[var(--wc-purple)] hover:bg-[var(--wc-purple-100)] transition-all duration-wc-2 active:scale-[0.98]"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-wc-sm bg-[var(--wc-purple)] text-white"
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-wc-lg bg-[var(--wc-bg-elevated)] border border-[var(--wc-border)] p-4 sm:p-5 space-y-4 shadow-wc-xs">
          <h2 className="text-[15px] font-medium text-[var(--wc-fg-1)]">
            {t("today")}
          </h2>
          <EmptyState
            icon={
              <Calendar
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={t("summary")}
            description={t("pending")}
          />
        </div>
      </div>
    </div>
  );
}
