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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] p-4 shadow-lg"
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-small text-[var(--color-text-primary)]">
          Usamos cookies essenciais para autenticação. Saiba mais em{" "}
          <Link
            href="/privacy-policy"
            className="text-[var(--color-primary)] hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={essentialOnly}
            className="h-10 px-4 rounded-md border border-[var(--color-border-secondary)] text-body-small hover:bg-[var(--color-bg-secondary)]"
          >
            Só essenciais
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="h-10 px-4 rounded-md bg-[var(--color-primary)] text-white text-body-small hover:bg-[var(--color-primary-hover)]"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
