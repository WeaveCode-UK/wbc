import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Coverage lift — / (Meu Dia): metric cards (loading vs data), quick actions
// route via next/navigation, OnboardingChecklist nested + driven by tRPC.

const hoisted = vi.hoisted(() => ({
  pushMock: vi.fn(),
  dashboard: {
    data: undefined as unknown,
    isLoading: true,
  } as { data: unknown; isLoading: boolean },
  unlocked: { data: undefined as unknown },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    analytics: {
      getDashboard: { useQuery: () => hoisted.dashboard },
    },
    platform: {
      getUnlockedFeatures: { useQuery: () => hoisted.unlocked },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hoisted.pushMock }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { renderWithIntl } from "../../components/__tests__/_test-utils";
import DashboardPage from "../(dashboard)/page";

describe("DashboardPage (Meu Dia)", () => {
  beforeEach(() => {
    hoisted.pushMock.mockReset();
    hoisted.dashboard = { data: undefined, isLoading: true };
    hoisted.unlocked = { data: undefined };
  });

  it("LOADING — metric tiles show skeleton placeholders", () => {
    hoisted.dashboard = { data: undefined, isLoading: true };
    const { container } = renderWithIntl(<DashboardPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBe(4);
  });

  it("DATA — metrics render the values formatted as BRL where appropriate", () => {
    hoisted.dashboard = {
      data: {
        salesThisMonth: 12,
        revenue: 1234.5,
        pendingReminders: 0,
        upcomingAppointments: 3,
      },
      isLoading: false,
    };
    renderWithIntl(<DashboardPage />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*1\.234,50/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders 4 quick-action buttons", () => {
    hoisted.dashboard = {
      data: {
        salesThisMonth: 0,
        revenue: 0,
        pendingReminders: 0,
        upcomingAppointments: 0,
      },
      isLoading: false,
    };
    renderWithIntl(<DashboardPage />);
    // The quick-actions section has 4 ARIA-labelled buttons.
    expect(
      screen.getByRole("button", { name: /Nova venda/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nova cliente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Enviar mensagem/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Pedir pra IA/i }),
    ).toBeInTheDocument();
  });

  it("clicking 'Nova venda' navigates to /sales/new", () => {
    hoisted.dashboard = {
      data: {
        salesThisMonth: 0,
        revenue: 0,
        pendingReminders: 0,
        upcomingAppointments: 0,
      },
      isLoading: false,
    };
    renderWithIntl(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: /Nova venda/i }));
    expect(hoisted.pushMock).toHaveBeenCalledWith("/sales/new");
  });

  it("renders the H1 'Meu Dia' header", () => {
    hoisted.dashboard = {
      data: {
        salesThisMonth: 0,
        revenue: 0,
        pendingReminders: 0,
        upcomingAppointments: 0,
      },
      isLoading: false,
    };
    renderWithIntl(<DashboardPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Meu Dia/i }),
    ).toBeInTheDocument();
  });

  it("warning copy appears only when there are pending reminders", () => {
    hoisted.dashboard = {
      data: {
        salesThisMonth: 0,
        revenue: 0,
        pendingReminders: 7,
        upcomingAppointments: 0,
      },
      isLoading: false,
    };
    renderWithIntl(<DashboardPage />);
    expect(screen.getByText("7")).toBeInTheDocument();
    // pending sub-label from analytics i18n (lowercase "pendentes")
    expect(screen.getByText(/pendentes/i)).toBeInTheDocument();
  });
});
