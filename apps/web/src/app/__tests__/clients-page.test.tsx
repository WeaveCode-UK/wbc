import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";

// T4.4 — /clients async surface: skeleton / empty / error / list.

const hoisted = vi.hoisted(() => ({
  listQuery: {
    data: undefined as unknown,
    isLoading: true,
    error: null as null | { message: string },
  },
  tagsQuery: { data: [], isLoading: false, error: null },
  bulkMutation: {
    mutate: vi.fn(),
    isPending: false,
    error: null as null | { message: string },
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    clients: {
      list: { useQuery: () => hoisted.listQuery },
      listTags: { useQuery: () => hoisted.tagsQuery },
      bulkUpdate: {
        useMutation: () => hoisted.bulkMutation,
      },
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        }),
      },
    },
    useUtils: () => ({ clients: { list: { invalidate: vi.fn() } } }),
  },
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), show: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { renderWithIntl } from "../../components/__tests__/_test-utils";
import ClientsPage from "../(dashboard)/clients/page";

describe("ClientsPage — 4 async states", () => {
  beforeEach(() => {
    hoisted.listQuery = { data: undefined, isLoading: true, error: null };
    hoisted.tagsQuery = { data: [], isLoading: false, error: null };
    hoisted.bulkMutation = { mutate: vi.fn(), isPending: false, error: null };
  });

  it("LOADING — renders skeleton placeholders", () => {
    hoisted.listQuery = { data: undefined, isLoading: true, error: null };
    const { container } = renderWithIntl(<ClientsPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("EMPTY — renders empty state with add CTA", () => {
    hoisted.listQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 50 } },
      isLoading: false,
      error: null,
    };
    renderWithIntl(<ClientsPage />);
    // The empty state title comes from clients.no_clients
    expect(screen.getByText(/Nenhum cliente cadastrado/i)).toBeInTheDocument();
  });

  it("ERROR — when query has error and no data, page still renders header (no crash)", () => {
    hoisted.listQuery = {
      data: undefined,
      isLoading: false,
      error: { message: "boom" },
    };
    renderWithIntl(<ClientsPage />);
    expect(
      screen.getByRole("heading", { name: /Clientes/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("DATA — renders one item per client", () => {
    hoisted.listQuery = {
      data: {
        data: [
          {
            id: "c-1",
            name: "Maria",
            phone: "+5511999990001",
            isLead: false,
            classification: "A",
          },
          {
            id: "c-2",
            name: "Joana",
            phone: "+5511999990002",
            isLead: true,
            classification: "B",
          },
        ],
        meta: { total: 2, page: 1, limit: 50 },
      },
      isLoading: false,
      error: null,
    };
    renderWithIntl(<ClientsPage />);
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("Joana")).toBeInTheDocument();
    // The "Leads" badge shows up because Joana.isLead = true
    const badges = screen.getAllByText(/Leads/i);
    expect(badges.length).toBeGreaterThan(0);
  });
});
