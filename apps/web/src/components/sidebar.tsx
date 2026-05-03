"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGroup, motion } from "framer-motion";
import {
  Bell,
  type LucideIcon,
  BarChart3,
  Calendar,
  ChevronDown,
  FileText,
  Globe,
  Home,
  MessageSquare,
  Megaphone,
  Package,
  Palette,
  Repeat,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { cn } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface NavItem {
  href: string;
  key: string;
  Icon: LucideIcon;
  vertical?: "beauty" | "health" | "business";
}

interface NavSection {
  id: string;
  labelKey: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    id: "main",
    labelKey: "nav_section_main",
    items: [
      { href: "/", key: "nav_my_day", Icon: Home },
      { href: "/clients", key: "nav_clients", Icon: Users },
      { href: "/sales", key: "nav_sales", Icon: Wallet },
      { href: "/schedule", key: "nav_schedule", Icon: Calendar },
    ],
  },
  {
    id: "comm",
    labelKey: "nav_section_comm",
    items: [
      { href: "/campaigns", key: "nav_campaigns", Icon: Megaphone },
      { href: "/messaging/templates", key: "nav_templates", Icon: FileText },
      {
        href: "/messaging/quick-replies",
        key: "nav_quick_replies",
        Icon: MessageSquare,
      },
      { href: "/messaging/post-sale", key: "nav_post_sale", Icon: Repeat },
    ],
  },
  {
    id: "ops",
    labelKey: "nav_section_ops",
    items: [
      { href: "/inventory", key: "nav_inventory", Icon: Package },
      {
        href: "/catalog",
        key: "nav_catalog",
        Icon: ShoppingBag,
        vertical: "beauty",
      },
      { href: "/logistics", key: "nav_logistics", Icon: Truck },
    ],
  },
  {
    id: "marketing",
    labelKey: "nav_section_marketing",
    items: [
      { href: "/landing", key: "nav_landing", Icon: Globe },
      {
        href: "/showcases",
        key: "nav_showcases",
        Icon: ShoppingBag,
        vertical: "beauty",
      },
      { href: "/promo/new", key: "nav_promo", Icon: Palette },
      { href: "/tags", key: "nav_tags", Icon: Tag },
    ],
  },
  {
    id: "intel",
    labelKey: "nav_section_intel",
    items: [
      {
        href: "/finance",
        key: "nav_finance",
        Icon: BarChart3,
        vertical: "health",
      },
      {
        href: "/analytics",
        key: "nav_analytics",
        Icon: BarChart3,
      },
      { href: "/ai", key: "nav_ai", Icon: Sparkles },
      { href: "/team", key: "nav_team", Icon: UsersRound },
    ],
  },
  {
    id: "settings",
    labelKey: "nav_section_settings",
    items: [
      { href: "/notifications", key: "nav_notifications", Icon: Bell },
      { href: "/settings", key: "nav_settings", Icon: Settings },
    ],
  },
];

const verticalDot: Record<NonNullable<NavItem["vertical"]>, string> = {
  beauty: "var(--wc-beauty)",
  health: "var(--wc-health)",
  business: "var(--wc-business)",
};

function isActiveHref(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  label: string;
  badge?: number;
  rail?: boolean;
}

function NavLink({ item, active, label, badge, rail }: NavLinkProps) {
  const { Icon } = item;

  // Shared rail-indicator: a 3px orange bar on the left edge of the
  // active item that smoothly animates between items via Framer
  // Motion's layoutId.
  const railIndicator = active ? (
    <motion.span
      layoutId="sidebar-active-rail"
      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--wc-orange)]"
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      aria-hidden="true"
    />
  ) : null;

  if (rail) {
    return (
      <Link
        href={item.href}
        title={label}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex h-10 w-10 items-center justify-center rounded-wc-sm border transition-all duration-wc-2 ease-wc-out",
          active
            ? "bg-[var(--wc-purple)] border-[var(--wc-purple)] text-white shadow-[0_4px_12px_rgba(129,39,232,0.4)]"
            : "border-transparent text-[var(--wc-orange)] hover:border-[var(--wc-orange)] hover:bg-white/[0.04]",
        )}
      >
        {railIndicator}
        <Icon
          aria-hidden="true"
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            active ? "text-white" : "",
          )}
          strokeWidth={active ? 2 : 1.75}
        />
        {badge && badge > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--wc-orange)] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--wc-blue-800)]"
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-wc-sm border px-3 py-2 text-[13px] transition-all duration-wc-2 ease-wc-out min-h-[40px]",
        active
          ? "bg-[var(--wc-purple)] border-[var(--wc-purple)] text-white font-bold shadow-[0_4px_12px_rgba(129,39,232,0.4)]"
          : "border-transparent text-white/75 font-medium hover:border-[var(--wc-orange)] hover:text-white hover:font-bold hover:translate-x-0.5",
      )}
    >
      {railIndicator}
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors duration-wc-2",
        )}
        style={{
          background: active
            ? "#fff"
            : item.vertical
              ? verticalDot[item.vertical]
              : "var(--wc-orange)",
        }}
      />
      <Icon
        aria-hidden="true"
        className={cn(
          "h-4 w-4 shrink-0 transition-colors duration-wc-2",
          active ? "text-white" : "text-[var(--wc-orange)]",
        )}
        strokeWidth={active ? 2 : 1.75}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span
          className={cn(
            "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
            active
              ? "bg-white/20 text-white"
              : "bg-[var(--wc-orange)] text-white",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

interface SidebarProps {
  mode?: "full" | "rail";
}

export function Sidebar({ mode = "full" }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("common");

  // Live unread-notifications count drives the badge on the
  // /notifications nav item (and any section that contains it).
  // Refetch every 60s while the app is open.
  const notifications = trpc.schedule.listNotifications.useQuery(
    { page: 1, limit: 1 },
    { refetchInterval: 60_000, refetchOnWindowFocus: true },
  );
  const unread = notifications.data?.unread ?? 0;

  // Map href → badge count. Add more entries here as endpoints emerge.
  const badges: Record<string, number> = useMemo(
    () => ({ "/notifications": unread }),
    [unread],
  );

  // The section that owns the current route — used both to auto-open
  // the accordion AND to drive the persistent orange border on the
  // section header even when collapsed.
  const activeSectionId = useMemo(() => {
    for (const section of sections) {
      if (section.items.some((item) => isActiveHref(pathname, item.href))) {
        return section.id;
      }
    }
    return sections[0]?.id ?? null;
  }, [pathname]);

  const [openSection, setOpenSection] = useState<string | null>(
    activeSectionId,
  );

  useEffect(() => {
    setOpenSection(activeSectionId);
  }, [activeSectionId]);

  // Per-section unread totals (sum of all items in section that have a
  // badge). Used to surface the count on the collapsed header.
  const sectionUnread = useMemo(() => {
    const map: Record<string, number> = {};
    for (const section of sections) {
      let total = 0;
      for (const item of section.items) total += badges[item.href] ?? 0;
      map[section.id] = total;
    }
    return map;
  }, [badges]);

  // ---- Rail mode (icons-only, 60px wide) ----
  if (mode === "rail") {
    const flatItems = sections.flatMap((s) => s.items);
    return (
      <aside
        aria-label={t("app_name")}
        className="hidden md:flex md:w-[60px] md:flex-col items-center bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot text-white"
      >
        <div className="flex h-14 w-full items-center justify-center border-b border-white/10">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-wc-sm bg-[var(--wc-purple)] font-serif italic text-white text-[14px]"
          >
            {"{w}"}
          </span>
        </div>
        <LayoutGroup>
          <nav className="flex flex-1 flex-col items-center gap-1 px-2 py-4 overflow-y-auto">
            {flatItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActiveHref(pathname, item.href)}
                label={t(item.key)}
                badge={badges[item.href]}
                rail
              />
            ))}
          </nav>
        </LayoutGroup>
      </aside>
    );
  }

  // ---- Full mode (240px) ----
  return (
    <aside
      aria-label={t("app_name")}
      className="hidden md:flex md:w-[240px] md:flex-col bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot text-white"
    >
      <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-white/10">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-wc-sm bg-[var(--wc-purple)] font-serif italic text-white text-[13px]"
        >
          {"{w}"}
        </span>
        <span className="text-[15px] font-semibold tracking-tight">WBC</span>
      </div>
      <LayoutGroup>
        <nav className="flex-1 space-y-1.5 px-3 py-5 overflow-y-auto">
          {sections.map((section) => {
            const open = openSection === section.id;
            const hasActiveItem = activeSectionId === section.id;
            const sectionBadge = sectionUnread[section.id] ?? 0;
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => setOpenSection(open ? null : section.id)}
                  aria-expanded={open}
                  aria-controls={`nav-section-${section.id}`}
                  className={cn(
                    "flex w-full items-center justify-between rounded-wc-sm border px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors duration-wc-2",
                    open
                      ? "bg-white/[0.06] text-white"
                      : hasActiveItem
                        ? "text-white hover:bg-white/[0.04]"
                        : "text-white/65 hover:bg-white/[0.04] hover:text-white/90",
                    hasActiveItem
                      ? "border-[var(--wc-orange)]"
                      : open
                        ? "border-white/10 hover:border-[var(--wc-orange)]"
                        : "border-transparent hover:border-[var(--wc-orange)]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {t(section.labelKey)}
                    {!open && sectionBadge > 0 ? (
                      <span
                        aria-label={`${sectionBadge} não lidos`}
                        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--wc-orange)] px-1 text-[10px] font-bold text-white"
                      >
                        {sectionBadge > 99 ? "99+" : sectionBadge}
                      </span>
                    ) : null}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-5 w-5 transition-transform duration-wc-3 ease-wc-out",
                      open ? "rotate-0" : "-rotate-90",
                    )}
                    strokeWidth={2}
                  />
                </button>
                <div
                  id={`nav-section-${section.id}`}
                  aria-hidden={!open}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-wc-3 ease-wc-out",
                    open
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-0.5 pt-1 pb-1">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.href}
                          item={item}
                          active={isActiveHref(pathname, item.href)}
                          label={t(item.key)}
                          badge={badges[item.href]}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </LayoutGroup>
    </aside>
  );
}
