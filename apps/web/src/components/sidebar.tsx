"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@wbc/ui";

// Sidebar refit (post audit, 2026-05-03): groups grew from 9 flat items
// to ~18 across 5 sections so previously-orphaned pages (templates,
// post-sale, logistics, ai, promo, landing, etc.) become discoverable.
// The groups follow the user's mental model: what do they reach for in
// a normal day? Comm = "I want to talk to a client", Ops = "I'm running
// my back-office", Marketing = "I'm growing", Intel = "I'm deciding".

interface NavItem {
  href: string;
  key: string;
  icon: string;
  dot: string;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    labelKey: "nav_section_main",
    items: [
      { href: "/", key: "nav_my_day", icon: "🏠", dot: "var(--color-primary)" },
      {
        href: "/clients",
        key: "nav_clients",
        icon: "👥",
        dot: "var(--color-info)",
      },
      {
        href: "/sales",
        key: "nav_sales",
        icon: "💰",
        dot: "var(--color-success)",
      },
      {
        href: "/schedule",
        key: "nav_schedule",
        icon: "📅",
        dot: "var(--color-info)",
      },
    ],
  },
  {
    labelKey: "nav_section_comm",
    items: [
      {
        href: "/campaigns",
        key: "nav_campaigns",
        icon: "📢",
        dot: "var(--color-warning)",
      },
      {
        href: "/messaging/templates",
        key: "nav_templates",
        icon: "📝",
        dot: "var(--color-warning)",
      },
      {
        href: "/messaging/quick-replies",
        key: "nav_quick_replies",
        icon: "💬",
        dot: "var(--color-warning)",
      },
      {
        href: "/messaging/post-sale",
        key: "nav_post_sale",
        icon: "🔁",
        dot: "var(--color-warning)",
      },
    ],
  },
  {
    labelKey: "nav_section_ops",
    items: [
      {
        href: "/inventory",
        key: "nav_inventory",
        icon: "📦",
        dot: "var(--color-warning)",
      },
      {
        href: "/catalog",
        key: "nav_catalog",
        icon: "🛍️",
        dot: "var(--color-warning)",
      },
      {
        href: "/logistics",
        key: "nav_logistics",
        icon: "🚚",
        dot: "var(--color-info)",
      },
    ],
  },
  {
    labelKey: "nav_section_marketing",
    items: [
      {
        href: "/landing",
        key: "nav_landing",
        icon: "🌐",
        dot: "var(--color-primary)",
      },
      {
        href: "/showcases",
        key: "nav_showcases",
        icon: "🛍️",
        dot: "var(--color-primary)",
      },
      {
        href: "/promo",
        key: "nav_promo",
        icon: "🎨",
        dot: "var(--color-primary)",
      },
      {
        href: "/tags",
        key: "nav_tags",
        icon: "🏷️",
        dot: "var(--color-text-tertiary)",
      },
    ],
  },
  {
    labelKey: "nav_section_intel",
    items: [
      {
        href: "/finance",
        key: "nav_finance",
        icon: "📊",
        dot: "var(--color-success)",
      },
      { href: "/ai", key: "nav_ai", icon: "✨", dot: "var(--color-primary)" },
      {
        href: "/team",
        key: "nav_team",
        icon: "👩‍👩‍👧",
        dot: "var(--color-primary)",
      },
    ],
  },
];

const trailing: NavItem[] = [
  {
    href: "/notifications",
    key: "nav_notifications",
    icon: "🔔",
    dot: "var(--color-info)",
  },
  {
    href: "/settings",
    key: "nav_settings",
    icon: "⚙️",
    dot: "var(--color-text-tertiary)",
  },
];

function NavLink({
  item,
  active,
  label,
}: {
  item: NavItem;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-body-small font-medium transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        active
          ? "bg-[var(--color-primary-surface)] text-[var(--color-primary)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]",
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-bg-secondary)] text-sm">
        {item.icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {active && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: item.dot }}
        />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("common");

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`) === true;
  };

  return (
    <aside className="hidden md:flex md:w-[240px] md:flex-col border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)]">
      <div className="flex h-14 items-center px-6 border-b border-[var(--color-border-tertiary)]">
        <span
          className="text-heading-2 text-[var(--color-primary)]"
          style={{ fontFamily: "Azonix, Sora, sans-serif" }}
        >
          WBC
        </span>
      </div>
      <nav
        aria-label={t("app_name")}
        className="flex-1 space-y-4 p-3 overflow-y-auto"
      >
        {sections.map((section) => (
          <div key={section.labelKey}>
            <h2 className="px-3 pb-1 text-caption font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {t(section.labelKey)}
            </h2>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  label={t(item.key)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-[var(--color-border-tertiary)] space-y-0.5">
          {trailing.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              label={t(item.key)}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
