"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@wbc/ui";

const primaryNavItems = [
  { href: "/", key: "nav_my_day", icon: "🏠" },
  { href: "/clients", key: "nav_clients", icon: "👥" },
  { href: "/sales", key: "nav_sales", icon: "💰" },
  { href: "/schedule", key: "nav_schedule", icon: "📅" },
] as const;

const moreNavItems = [
  { href: "/campaigns", key: "nav_campaigns", icon: "📢" },
  { href: "/finance", key: "nav_finance", icon: "📊" },
  { href: "/inventory", key: "nav_inventory", icon: "📦" },
  { href: "/team", key: "nav_team", icon: "👩‍👩‍👧" },
  { href: "/settings", key: "nav_settings", icon: "⚙️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("common");
  const [moreOpen, setMoreOpen] = useState(false);

  // Close "More" when pathname changes (route navigated).
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Close on ESC for keyboard users.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const moreActive = moreNavItems.some((item) => pathname === item.href);

  return (
    <>
      {moreOpen && (
        <div
          role="presentation"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}
      {moreOpen && (
        <div
          id="bottom-nav-more"
          role="menu"
          aria-label={t("nav_more")}
          className="fixed bottom-14 left-2 right-2 z-50 rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] p-2 shadow-lg md:hidden"
        >
          <ul className="grid grid-cols-3 gap-2">
            {moreNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center rounded-md px-2 py-2 text-caption",
                    pathname === item.href
                      ? "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]",
                  )}
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="mt-0.5 text-[11px]">{t(item.key)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] md:hidden"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around">
          {primaryNavItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center py-2 px-3",
                pathname === item.href
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-tertiary)]",
              )}
            >
              <span className="text-xl" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5">{t(item.key)}</span>
            </Link>
          ))}
          <div className="relative -mt-6">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label={t("nav_more")}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-controls="bottom-nav-more"
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-white text-xl shadow-lg transition-colors",
                moreOpen || moreActive
                  ? "bg-[var(--color-primary-hover)]"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]",
              )}
            >
              <span aria-hidden="true">⋯</span>
            </button>
          </div>
          {primaryNavItems.slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center py-2 px-3",
                pathname === item.href
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-tertiary)]",
              )}
            >
              <span className="text-xl" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5">{t(item.key)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
