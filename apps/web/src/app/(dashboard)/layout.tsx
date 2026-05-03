"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Flower2,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelRightClose,
  Palette,
  Sun,
} from "lucide-react";
import { Badge } from "@wbc/ui";
import { Sidebar } from "../../components/sidebar";
import { BottomNav } from "../../components/bottom-nav";
import { BrandSelector } from "../../components/brand-selector";
import { ErrorBoundary } from "../../components/error-boundary";
import { useTheme } from "../../providers/theme-provider";
import { BrandFilterProvider } from "../../providers/brand-filter-provider";
import { trpc } from "@/lib/trpc";

const SIDEBAR_STORAGE_KEY = "wbc-sidebar-mode";

type SidebarMode = "full" | "rail" | "hidden";

const MODE_CYCLE: Record<SidebarMode, SidebarMode> = {
  full: "rail",
  rail: "hidden",
  hidden: "full",
};

const MODE_LABEL: Record<SidebarMode, string> = {
  full: "Compactar menu",
  rail: "Ocultar menu",
  hidden: "Mostrar menu",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, mode, toggleMode, setTheme } = useTheme();
  const t = useTranslations("common");
  const tenantBadge = trpc.platform.getTenantBadge.useQuery(undefined, {
    refetchOnMount: false,
  });

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("full");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "rail" || stored === "hidden" || stored === "full") {
        setSidebarMode(stored);
      }
    } catch {
      /* localStorage may be unavailable */
    }
  }, []);

  const cycleSidebar = () => {
    setSidebarMode((prev) => {
      const next = MODE_CYCLE[prev];
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next);
      } catch {
        /* no-op */
      }
      return next;
    });
  };

  const ThemeIcon = theme === "default" ? Palette : Flower2;
  const ModeIcon = mode === "light" ? Moon : Sun;

  // Different icon per state communicates what the next click does:
  // - full → arrow pointing right toward the rail
  // - rail → arrow pointing left toward fully-hidden
  // - hidden → hamburger to bring it back
  const ToggleIcon =
    sidebarMode === "full"
      ? PanelLeftClose
      : sidebarMode === "rail"
        ? PanelRightClose
        : Menu;

  return (
    <BrandFilterProvider>
      <div className="flex min-h-screen bg-[var(--wc-bg)]">
        {sidebarMode !== "hidden" && (
          <Sidebar mode={sidebarMode === "rail" ? "rail" : "full"} />
        )}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="hidden md:flex h-14 items-center justify-between border-b border-[var(--wc-border)] bg-white px-4 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cycleSidebar}
                aria-label={MODE_LABEL[sidebarMode]}
                title={MODE_LABEL[sidebarMode]}
                className="inline-flex h-9 items-center gap-2 rounded-wc-sm px-3 text-[13px] font-medium text-[var(--wc-fg-2)] hover:bg-[var(--wc-bg-muted)] hover:text-[var(--wc-fg-1)] transition-colors duration-wc-2"
              >
                <ToggleIcon
                  className="h-5 w-5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Menu
              </button>
              {tenantBadge.data?.isDemo && (
                <Badge variant="warning">DEMO</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <BrandSelector />
              <button
                type="button"
                onClick={() =>
                  setTheme(theme === "default" ? "rose" : "default")
                }
                aria-label={
                  theme === "default"
                    ? `Trocar para tema rosa`
                    : `Trocar para tema padrão`
                }
                className="inline-flex items-center gap-2 rounded-wc-sm px-3 py-1.5 text-[12px] font-medium text-[var(--wc-fg-3)] hover:bg-[var(--wc-bg-muted)] hover:text-[var(--wc-fg-2)] transition-colors duration-wc-2"
              >
                <ThemeIcon
                  className="h-4 w-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {theme === "default" ? t("theme_default") : t("theme_rose")}
              </button>
              <button
                type="button"
                onClick={toggleMode}
                aria-label={
                  mode === "light" ? "Ativar modo escuro" : "Ativar modo claro"
                }
                className="inline-flex items-center gap-2 rounded-wc-sm px-3 py-1.5 text-[12px] font-medium text-[var(--wc-fg-3)] hover:bg-[var(--wc-bg-muted)] hover:text-[var(--wc-fg-2)] transition-colors duration-wc-2"
              >
                <ModeIcon
                  className="h-4 w-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {mode === "light" ? "Dark" : "Light"}
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--wc-purple)] text-white text-[11px] font-semibold">
                MC
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Sair"
                className="inline-flex items-center gap-2 rounded-wc-sm px-3 py-1.5 text-[12px] font-medium text-[var(--wc-fg-3)] hover:bg-[var(--wc-bg-muted)] hover:text-[var(--wc-error)] transition-colors duration-wc-2"
              >
                <LogOut
                  className="h-4 w-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Sair
              </button>
            </div>
          </header>
          <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
        <BottomNav />
      </div>
    </BrandFilterProvider>
  );
}
