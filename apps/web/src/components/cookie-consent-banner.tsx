"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ACH-016 compliance-privacidade: cookie consent banner.
// Minimal accept/reject with localStorage persistence. Non-essential
// trackers (analytics future-proof) must only fire when
// preferences.analytics === true.
//
// For now only NextAuth session cookies are used (essential by LGPD art. 7.V
// / GDPR art. 6.1.b execution-of-contract) so the banner is informative.
// When analytics lands, wire it to read from this store.
//
// docs/COOKIES-POLICY.md lists follow-up work.

const STORAGE_KEY = "wbc-cookie-consent";

type Preferences = {
  essential: true; // always
  analytics: boolean;
  acceptedAt: string;
};

function readPreferences(): Preferences | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Preferences;
    return parsed;
  } catch {
    return null;
  }
}

function writePreferences(prefs: Preferences): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = readPreferences();
    if (existing) setDismissed(true);
  }, []);

  if (!mounted || dismissed) return null;

  const acceptAll = () => {
    writePreferences({
      essential: true,
      analytics: true,
      acceptedAt: new Date().toISOString(),
    });
    setDismissed(true);
  };

  const essentialOnly = () => {
    writePreferences({
      essential: true,
      analytics: false,
      acceptedAt: new Date().toISOString(),
    });
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--wc-border)] bg-white p-4 shadow-wc-lg"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] font-light text-[var(--wc-fg-2)]">
          Usamos cookies essenciais para autenticação. Saiba mais em{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-[var(--wc-purple)] hover:text-[var(--wc-purple-600)] hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={essentialOnly}
            className="min-h-[44px] rounded-wc-sm border border-[var(--wc-border)] bg-white px-4 text-[13px] font-medium text-[var(--wc-fg-1)] transition-colors duration-wc-2 hover:bg-[var(--wc-bg-muted)]"
          >
            Só essenciais
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="min-h-[44px] rounded-wc-sm bg-[var(--wc-purple)] px-4 text-[13px] font-medium text-white transition-colors duration-wc-2 hover:bg-[var(--wc-purple-600)] hover:shadow-[0_4px_12px_rgba(129,39,232,0.35)]"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
