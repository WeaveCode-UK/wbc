"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Calendar,
  Home,
  type LucideIcon,
  Megaphone,
  MoreHorizontal,
  Package,
  Settings,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { cn } from "@wbc/ui";

interface BottomNavItem {
  href: string;
  key: string;
  Icon: LucideIcon;
}

const primaryNavItems: BottomNavItem[] = [
  { href: "/", key: "nav_my_day", Icon: Home },
  { href: "/clients", key: "nav_clients", Icon: Users },
  { href: "/sales", key: "nav_sales", Icon: Wallet },
  { href: "/schedule", key: "nav_schedule", Icon: Calendar },
];

const moreNavItems: BottomNavItem[] = [
  { href: "/campaigns", key: "nav_campaigns", Icon: Megaphone },
  { href: "/finance", key: "nav_finance", Icon: BarChart3 },
  { href: "/inventory", key: "nav_inventory", Icon: Package },
  { href: "/team", key: "nav_team", Icon: UsersRound },
  { href: "/settings", key: "nav_settings", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("common");
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

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
          className="fixed inset-0 z-40 bg-[var(--wc-blue-800)]/55 backdrop-blur-sm md:hidden"
        />
      )}
      {moreOpen && (
        <div
          id="bottom-nav-more"
          role="menu"
          aria-label={t("nav_more")}
          className="fixed bottom-16 left-3 right-3 z-50 rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-3 shadow-wc-lg md:hidden"
        >
          <ul className="grid grid-cols-3 gap-2">
            {moreNavItems.map(({ href, key, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  role="menuitem"
                  className={cn(
                    "flex min-h-[64px] flex-col items-center justify-center rounded-wc-sm px-2 py-2 text-[11px] font-medium transition-colors duration-wc-2",
                    pathname === href
                      ? "bg-[var(--wc-purple-50)] text-[var(--wc-purple-700)]"
                      : "text-[var(--wc-fg-2)] hover:bg-[var(--wc-bg-muted)]",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.75}
                  />
                  <span className="mt-1">{t(key)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] md:hidden"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2">
          {primaryNavItems.slice(0, 2).map(({ href, key, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] min-w-[56px] flex-col items-center py-2 px-3 transition-colors duration-wc-2",
                pathname === href
                  ? "text-[var(--wc-purple)]"
                  : "text-[var(--wc-fg-3)]",
              )}
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
              <span className="text-[10px] mt-1 font-medium">{t(key)}</span>
            </Link>
          ))}
          <div className="relative -mt-7">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label={t("nav_more")}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-controls="bottom-nav-more"
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full text-white transition-colors duration-wc-2",
                "shadow-[0_8px_24px_rgba(129,39,232,0.4)]",
                moreOpen || moreActive
                  ? "bg-[var(--wc-purple-600)]"
                  : "bg-[var(--wc-purple)] hover:bg-[var(--wc-purple-600)]",
              )}
            >
              <MoreHorizontal
                aria-hidden="true"
                className="h-6 w-6"
                strokeWidth={2}
              />
            </button>
          </div>
          {primaryNavItems.slice(2).map(({ href, key, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] min-w-[56px] flex-col items-center py-2 px-3 transition-colors duration-wc-2",
                pathname === href
                  ? "text-[var(--wc-purple)]"
                  : "text-[var(--wc-fg-3)]",
              )}
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
              <span className="text-[10px] mt-1 font-medium">{t(key)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
