"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
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
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {t("settings")}
      </Link>

      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("theme_title")}
        </h1>
        <p className="text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          {t("theme_subtitle")}
        </p>
      </header>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
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
                  "flex items-center gap-3 rounded-wc-lg border p-3 text-left transition-colors " +
                  (checked
                    ? "border-[var(--wc-purple)] ring-2 ring-[var(--wc-purple)] bg-[var(--wc-purple-50)]"
                    : "border-[var(--wc-border)] bg-white hover:bg-[var(--wc-bg-muted)]")
                }
              >
                <span
                  aria-hidden="true"
                  className="h-10 w-10 flex-shrink-0 rounded-md"
                  style={{ background: opt.swatch }}
                />
                <span>
                  <span className="block text-[13px] text-[var(--wc-fg-1)]">
                    {t(opt.titleKey)}
                  </span>
                  <span className="block text-[12px] text-[var(--wc-fg-3)]">
                    {t(opt.hintKey)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("theme_mode")}
            </h2>
            <p className="text-[12px] text-[var(--wc-fg-3)]">
              {mode === "light" ? t("theme_mode_light") : t("theme_mode_dark")}
            </p>
          </div>
          <ToggleSwitch checked={mode === "dark"} onChange={toggleMode} />
        </div>
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 sm:p-6 space-y-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
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
                    ? "border-[var(--wc-purple)] ring-2 ring-[var(--wc-purple)] bg-[var(--wc-purple-50)]"
                    : "border-[var(--wc-border)] bg-white hover:bg-[var(--wc-bg-muted)]")
                }
              >
                <span className="text-[13px] text-[var(--wc-fg-1)]">
                  {t(opt.labelKey)}
                </span>
                {checked && (
                  <span aria-hidden="true" className="text-[var(--wc-purple)]">
                    <Check className="h-4 w-4" strokeWidth={2} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-muted)] shadow-wc-xs p-5 sm:p-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("theme_preview_title")}
        </h2>
        <p className="text-[12px] text-[var(--wc-fg-3)]">
          {t("theme_preview_hint")}
        </p>
      </section>
    </div>
  );
}
