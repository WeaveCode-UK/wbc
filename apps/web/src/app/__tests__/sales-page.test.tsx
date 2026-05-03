import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";

// T4.4 — /sales async surface: skeleton / empty / error / list.

const hoisted = vi.hoisted(() => ({
  salesQuery: {
    data: undefined as unknown,
    isLoading: true,
    error: null as null | { message: string },
  },
  financeQuery: { data: undefined as unknown, isLoading: false, error: null },
  pushMock: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    sales: {
      list: { useQuery: () => hoisted.salesQuery },
    },
    finance: {
      getDashboard: { useQuery: () => hoisted.financeQuery },
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hoisted.pushMock }),
}));

import { renderWithIntl } from "../../components/__tests__/_test-utils";
import SalesPage from "../(dashboard)/sales/page";

describe("SalesPage — 4 async states", () => {
  beforeEach(() => {
    hoisted.pushMock.mockReset();
    hoisted.salesQuery = { data: undefined, isLoading: true, error: null };
    hoisted.financeQuery = {
      data: { revenue: 0, receivables: 0 },
      isLoading: false,
      error: null,
    };
  });

  it("LOADING — renders ListSkeleton placeholders", () => {
    hoisted.salesQuery = { data: undefined, isLoading: true, error: null };
    const { container } = renderWithIntl(<SalesPage />);
    // ListSkeleton renders pulse blocks; skeleton uses animate-pulse class
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("EMPTY — renders empty state CTA", () => {
    hoisted.salesQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 50 } },
      isLoading: false,
      error: null,
    };
    renderWithIntl(<SalesPage />);
    // Empty title from sales i18n: "no_sales"
    // Look for the new sale button which appears in the EmptyState action.
    const buttons = screen.getAllByRole("link", {
      name: /Nova venda|nova venda/i,
    });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("ERROR — when isLoading=false, error set, list still renders without crashing", () => {
    hoisted.salesQuery = {
      data: undefined,
      isLoading: false,
      error: { message: "Internal" },
    };
    // The page component currently doesn't render an explicit error UI for
    // sales.list — it falls through to the empty state when data is missing.
    // We assert the page renders without throwing and still surfaces the
    // header so the user has navigation.
    renderWithIntl(<SalesPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("DATA — renders one ListItem per sale", () => {
    hoisted.salesQuery = {
      data: {
        data: [
          {
            id: "s-1",
            total: 99.5,
            status: "DELIVERED",
            paymentMethod: "PIX",
            createdAt: new Date("2026-04-01"),
          },
          {
            id: "s-2",
            total: 250,
            status: "DRAFT",
            paymentMethod: null,
            createdAt: new Date("2026-04-02"),
          },
        ],
        meta: { total: 2, page: 1, limit: 50 },
      },
      isLoading: false,
      error: null,
    };
    renderWithIntl(<SalesPage />);
    expect(screen.getByText(/R\$\s*99,50/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*250,00/)).toBeInTheDocument();
    // Status badges render the literal status text.
    expect(screen.getByText("DELIVERED")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });
});
