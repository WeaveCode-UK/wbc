"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Alert, Button, ToggleSwitch } from "@wbc/ui";
import { ProfileSettingsForm } from "./_components/profile-settings-form";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// ACH-017 (partial): Settings becomes tabbed and Profile is the first tab
// with a real form. Plan tab still depends on platform.getSubscription which
// is not yet exposed; tracked under F11.E15 in prompts/fase-11.
type SettingsTab =
  | "profile"
  | "plan"
  | "landing"
  | "pix"
  | "career"
  | "export"
  | "theme"
  | "demo";

const TABS: Array<{
  id: SettingsTab;
  key: string;
  fallback?: string;
  adminOnly?: boolean;
}> = [
  { id: "profile", key: "profile" },
  { id: "plan", key: "plan" },
  { id: "landing", key: "landing_page" },
  { id: "pix", key: "pix_settings" },
  { id: "career", key: "career_goals", fallback: "Metas de carreira" },
  { id: "export", key: "export_data" },
  { id: "theme", key: "theme_title" },
  { id: "demo", key: "demo_mode_title", adminOnly: true },
];

export default function SettingsPage() {
  const t = useTranslations("platform");
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN";
  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);
  const toast = useToast();
  const [active, setActive] = useState<SettingsTab>("profile");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const tenantBadge = trpc.platform.getTenantBadge.useQuery(undefined, {
    refetchOnMount: false,
  });
  const utils = trpc.useUtils();
  const setDemoMode = trpc.platform.setDemoMode.useMutation({
    onSuccess: () => {
      void utils.platform.getTenantBadge.invalidate();
      toast.success(t("demo_mode_saved"));
    },
    onError: (err) => toast.error(err.message),
  });
  const resetDemo = trpc.platform.resetDemo.useMutation({
    onSuccess: () => toast.success(t("demo_mode_reset_done")),
    onError: (err) => toast.error(err.message),
  });

  const referral = trpc.platform.getReferralCode.useQuery(undefined, {
    enabled: false,
  });
  const exportMutation = trpc.platform.exportData.useQuery(undefined, {
    enabled: false,
  });

  const triggerExport = async () => {
    setExportNotice(null);
    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wbc-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setExportNotice(t("export_data_hint"));
      }
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        {t("settings")}
      </h1>

      <div
        role="tablist"
        aria-label={t("settings")}
        className="mt-4 flex gap-1 overflow-x-auto border-b border-[var(--wc-border)]"
      >
        {visibleTabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`settings-panel-${tab.id}`}
              id={`settings-tab-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={
                "relative whitespace-nowrap px-4 py-2 text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)] rounded-t-md " +
                (isActive
                  ? "text-[var(--wc-purple)] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[var(--wc-purple)]"
                  : "text-[var(--wc-fg-2)] hover:text-[var(--wc-fg-1)]")
              }
            >
              {tab.fallback ?? t(tab.key)}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${active}`}
        aria-labelledby={`settings-tab-${active}`}
        className="mt-6"
      >
        {active === "profile" && <ProfileSettingsForm />}

        {active === "plan" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-2">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("plan")}
            </h2>
            <p className="text-[13px] text-[var(--wc-fg-3)]">
              {t("plan_hint")}
            </p>
          </div>
        )}

        {active === "landing" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-3">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("landing_page")}
            </h2>
            <p className="text-[13px] text-[var(--wc-fg-3)]">
              {t("landing_page_hint")}
            </p>
            <Link href="/landing">
              <Button type="button" size="sm">
                {t("landing_page")}
              </Button>
            </Link>
          </div>
        )}

        {active === "pix" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-3">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("pix_settings")}
            </h2>
            <p className="text-[13px] text-[var(--wc-fg-3)]">
              {t("pix_settings_hint")}
            </p>
            <Link href="/settings/pix">
              <Button type="button" size="sm">
                {t("pix_settings")}
              </Button>
            </Link>
          </div>
        )}

        {active === "career" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-3">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              Metas de carreira
            </h2>
            <p className="text-[13px] text-[var(--wc-fg-3)]">
              Acompanhe níveis e faturamento alvo por marca; receba alerta
              quando faltar pouco.
            </p>
            <Link href="/settings/career">
              <Button type="button" size="sm">
                Abrir metas
              </Button>
            </Link>
          </div>
        )}

        {active === "export" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-3">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("export_data")}
            </h2>
            <p className="text-[13px] text-[var(--wc-fg-3)]">
              {t("export_data_hint")}
            </p>
            {exportNotice && (
              <Alert variant={exportMutation.error ? "danger" : "success"}>
                {exportNotice}
              </Alert>
            )}
            <Button
              type="button"
              size="sm"
              onClick={triggerExport}
              disabled={exportMutation.isFetching}
            >
              {exportMutation.isFetching ? "..." : t("export_data")}
            </Button>
            <div className="border-t border-[var(--wc-border)] pt-3 space-y-1">
              <p className="text-[12px] text-[var(--wc-fg-3)]">
                {t("referral_label")}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => referral.refetch()}
                disabled={referral.isFetching}
              >
                {referral.data
                  ? referral.data.code || t("referral_generate")
                  : referral.isFetching
                    ? "..."
                    : t("referral_generate")}
              </Button>
            </div>
          </div>
        )}

        {active === "theme" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-3">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("theme_title")}
            </h2>
            <p className="text-[13px] text-[var(--wc-fg-3)]">
              {t("theme_subtitle")}
            </p>
            <Link href="/settings/theme">
              <Button type="button" size="sm">
                {t("theme_title")}
              </Button>
            </Link>
          </div>
        )}

        {active === "demo" && isAdmin && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
                {t("demo_mode_title")}
              </h2>
              <p className="text-[13px] text-[var(--wc-fg-3)]">
                {t("demo_mode_subtitle")}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-wc-md border border-[var(--wc-border)] p-4">
              <div>
                <p className="text-[14px] font-medium text-[var(--wc-fg-1)]">
                  {t("demo_mode_toggle")}
                </p>
                <p className="text-[12px] text-[var(--wc-fg-3)]">
                  {t("demo_mode_toggle_help")}
                </p>
              </div>
              <ToggleSwitch
                checked={Boolean(tenantBadge.data?.isDemo)}
                onChange={(checked) => setDemoMode.mutate({ enabled: checked })}
              />
            </div>

            {tenantBadge.data?.isDemo && (
              <div className="rounded-wc-md border border-[var(--color-warning-text)] bg-[var(--color-warning-bg)] p-4 space-y-3">
                <p className="text-[13px] text-[var(--color-warning-text)]">
                  {t("demo_mode_reset_help")}
                </p>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm(t("demo_mode_reset_confirm"))) {
                      resetDemo.mutate();
                    }
                  }}
                  loading={resetDemo.isPending}
                  disabled={resetDemo.isPending}
                >
                  {t("demo_mode_reset_button")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
