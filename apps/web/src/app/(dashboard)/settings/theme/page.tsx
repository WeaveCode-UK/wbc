"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ToggleSwitch } from "@wbc/ui";
import { useTheme } from "../../../../providers/theme-provider";

function writeLocaleCookie(locale: string) {
  // next-intl reads NEXT_LOCALE on the next server render; reload picks up
  // the new locale from the cookie via getLocale().
  document.cookie = `NEXT_LOCALE=${locale}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

const THEME_OPTIONS = [
  {
    id: "default" as const,
    titleKey: "theme_default",
    hintKey: "theme_default_hint",
    swatch: "linear-gradient(135deg,#1A0F33,#8127E8)",
  },
  {
    id: "rose" as const,
    titleKey: "theme_rose",
    hintKey: "theme_rose_hint",
    swatch: "linear-gradient(135deg,#150A10,#E91E8C)",
  },
];

const LANGUAGE_OPTIONS = [
  { id: "pt-BR", labelKey: "theme_language_pt" },
  { id: "en", labelKey: "theme_language_en" },
];

export default function ThemeSettingsPage() {
  const t = useTranslations("platform");
  const currentLocale = useLocale();
  const { theme, mode, setTheme, toggleMode } = useTheme();
  const [language, setLanguage] = useState(currentLocale);

  useEffect(() => {
    setLanguage(currentLocale);
  }, [currentLocale]);

  const onPickLanguage = (next: string) => {
    setLanguage(next);
    if (next !== currentLocale) {
      writeLocaleCookie(next);
      window.location.reload();
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/settings"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {t("settings")}
      </Link>

      <header>
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("theme_title")}
        </h1>
        <p className="text-caption text-[var(--color-text-tertiary)]">
          {t("theme_subtitle")}
        </p>
      </header>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("theme_color")}
        </h2>
        <div
          role="radiogroup"
          aria-label={t("theme_color")}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {THEME_OPTIONS.map((opt) => {
            const checked = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setTheme(opt.id)}
                className={
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors " +
                  (checked
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]"
                    : "border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]")
                }
              >
                <span
                  aria-hidden="true"
                  className="h-10 w-10 flex-shrink-0 rounded-md"
                  style={{ background: opt.swatch }}
                />
                <span>
                  <span className="block text-body-small text-[var(--color-text-primary)]">
                    {t(opt.titleKey)}
                  </span>
                  <span className="block text-caption text-[var(--color-text-tertiary)]">
                    {t(opt.hintKey)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("theme_mode")}
            </h2>
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {mode === "light" ? t("theme_mode_light") : t("theme_mode_dark")}
            </p>
          </div>
          <ToggleSwitch checked={mode === "dark"} onChange={toggleMode} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("theme_language")}
        </h2>
        <div
          role="radiogroup"
          aria-label={t("theme_language")}
          className="space-y-2"
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const checked = language === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onPickLanguage(opt.id)}
                className={
                  "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors " +
                  (checked
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]"
                    : "border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]")
                }
              >
                <span className="text-body-small text-[var(--color-text-primary)]">
                  {t(opt.labelKey)}
                </span>
                {checked && (
                  <span
                    aria-hidden="true"
                    className="text-[var(--color-primary)]"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] p-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("theme_preview_title")}
        </h2>
        <p className="text-caption text-[var(--color-text-tertiary)]">
          {t("theme_preview_hint")}
        </p>
      </section>
    </div>
  );
}
