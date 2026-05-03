"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button } from "@wbc/ui";
import { ProfileSettingsForm } from "./_components/profile-settings-form";
import { trpc } from "@/lib/trpc";

// ACH-017 (partial): Settings becomes tabbed and Profile is the first tab
// with a real form. Plan tab still depends on platform.getSubscription which
// is not yet exposed; tracked under F11.E15 in prompts/fase-11.
type SettingsTab = "profile" | "plan" | "landing" | "pix" | "export" | "theme";

const TABS: Array<{ id: SettingsTab; key: string }> = [
  { id: "profile", key: "profile" },
  { id: "plan", key: "plan" },
  { id: "landing", key: "landing_page" },
  { id: "pix", key: "pix_settings" },
  { id: "export", key: "export_data" },
  { id: "theme", key: "theme_title" },
];

export default function SettingsPage() {
  const t = useTranslations("platform");
  const [active, setActive] = useState<SettingsTab>("profile");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

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
        {TABS.map((tab) => {
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
              {t(tab.key)}
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
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-2">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("plan")}
            </h2>
            <p className="text-[13px] text-[var(--wc-fg-3)]">
              {t("plan_hint")}
            </p>
          </div>
        )}

        {active === "landing" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-3">
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
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-3">
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

        {active === "export" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-3">
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
              <p className="text-[12px] text-[var(--wc-fg-3)]">Referral</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => referral.refetch()}
                disabled={referral.isFetching}
              >
                {referral.data
                  ? referral.data.code || t("settings")
                  : referral.isFetching
                    ? "..."
                    : t("settings")}
              </Button>
            </div>
          </div>
        )}

        {active === "theme" && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-3">
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
      </div>
    </div>
  );
}
