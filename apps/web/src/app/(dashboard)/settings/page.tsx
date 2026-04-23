"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProfileSettingsForm } from "./_components/profile-settings-form";

// ACH-017 (partial): Settings becomes tabbed and Profile is the first tab
// with a real form. Plan, Landing, and Data Export are still stubs and are
// tracked in docs/UI-SETTINGS-FOLLOWUP.md.
type SettingsTab = "profile" | "plan" | "landing" | "export";

const TABS: Array<{ id: SettingsTab; key: string }> = [
  { id: "profile", key: "profile" },
  { id: "plan", key: "plan" },
  { id: "landing", key: "landing_page" },
  { id: "export", key: "export_data" },
];

export default function SettingsPage() {
  const t = useTranslations("platform");
  const [active, setActive] = useState<SettingsTab>("profile");

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
          <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6">
            <h2 className="text-heading-3 text-[var(--color-text-primary)]">
              {t("plan")}
            </h2>
            <p className="mt-1 text-body-small text-[var(--color-text-tertiary)]">
              {t("plan_hint")}
            </p>
          </div>
        )}

        {active === "landing" && (
          <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6">
            <h2 className="text-heading-3 text-[var(--color-text-primary)]">
              {t("landing_page")}
            </h2>
            <p className="mt-1 text-body-small text-[var(--color-text-tertiary)]">
              {t("landing_page_hint")}
            </p>
          </div>
        )}

        {active === "export" && (
          <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6">
            <h2 className="text-heading-3 text-[var(--color-text-primary)]">
              {t("export_data")}
            </h2>
            <p className="mt-1 text-body-small text-[var(--color-text-tertiary)]">
              {t("export_data_hint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
