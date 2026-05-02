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
type SettingsTab = "profile" | "plan" | "landing" | "export" | "theme";

const TABS: Array<{ id: SettingsTab; key: string }> = [
  { id: "profile", key: "profile" },
  { id: "plan", key: "plan" },
  { id: "landing", key: "landing_page" },
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
      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        {t("settings")}
      </h1>

      <div
        role="tablist"
        aria-label={t("settings")}
        className="mt-4 flex gap-1 overflow-x-auto border-b border-[var(--color-border-tertiary)]"
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
                "relative whitespace-nowrap px-4 py-2 text-body-small font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-t-md " +
                (isActive
                  ? "text-[var(--color-primary)] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")
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
          <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 space-y-2">
            <h2 className="text-heading-3 text-[var(--color-text-primary)]">
              {t("plan")}
            </h2>
            <p className="text-body-small text-[var(--color-text-tertiary)]">
              {t("plan_hint")}
            </p>
          </div>
        )}

        {active === "landing" && (
          <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
            <h2 className="text-heading-3 text-[var(--color-text-primary)]">
              {t("landing_page")}
            </h2>
            <p className="text-body-small text-[var(--color-text-tertiary)]">
              {t("landing_page_hint")}
            </p>
            <Link href="/landing">
              <Button type="button" size="sm">
                {t("landing_page")}
              </Button>
            </Link>
          </div>
        )}

        {active === "export" && (
          <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
            <h2 className="text-heading-3 text-[var(--color-text-primary)]">
              {t("export_data")}
            </h2>
            <p className="text-body-small text-[var(--color-text-tertiary)]">
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
            <div className="border-t border-[var(--color-border-tertiary)] pt-3 space-y-1">
              <p className="text-caption text-[var(--color-text-tertiary)]">
                Referral
              </p>
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
          <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 space-y-3">
            <h2 className="text-heading-3 text-[var(--color-text-primary)]">
              {t("theme_title")}
            </h2>
            <p className="text-body-small text-[var(--color-text-tertiary)]">
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
