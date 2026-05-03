import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Coverage lift — /campaigns/new wizard step 1: audience picker, recipient
// count summary, "Próximo" gating until at least one recipient is selected.

const hoisted = vi.hoisted(() => ({
  pushMock: vi.fn(),
  clientsQuery: {
    data: undefined as unknown,
    isLoading: false,
  } as { data: unknown; isLoading: boolean },
  tagsQuery: {
    data: [] as { id: string; name: string; color?: string | null }[],
    isLoading: false,
  },
  createMutate: vi.fn(),
  aiMutate: vi.fn(),
  state: {
    createPending: false,
    aiPending: false,
    aiError: null as { message: string } | null,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    clients: {
      list: { useQuery: () => hoisted.clientsQuery },
      listTags: { useQuery: () => hoisted.tagsQuery },
    },
    campaigns: {
      create: {
        useMutation: () => ({
          mutate: hoisted.createMutate,
          isPending: hoisted.state.createPending,
          error: null,
        }),
      },
    },
    ai: {
      generateCampaignText: {
        useMutation: () => ({
          mutate: hoisted.aiMutate,
          isPending: hoisted.state.aiPending,
          error: hoisted.state.aiError,
        }),
      },
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
import NewCampaignPage from "../(dashboard)/campaigns/new/page";

describe("NewCampaignPage — wizard step 1", () => {
  beforeEach(() => {
    hoisted.pushMock.mockReset();
    hoisted.createMutate.mockReset();
    hoisted.aiMutate.mockReset();
    hoisted.clientsQuery = { data: undefined, isLoading: false };
    hoisted.tagsQuery = { data: [], isLoading: false };
    hoisted.state.createPending = false;
    hoisted.state.aiPending = false;
    hoisted.state.aiError = null;
  });

  it("renders header with step counter 1/3", () => {
    hoisted.clientsQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 100 } },
      isLoading: false,
    };
    renderWithIntl(<NewCampaignPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Nova campanha/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });

  it("Anterior button is disabled at step 1", () => {
    hoisted.clientsQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 100 } },
      isLoading: false,
    };
    renderWithIntl(<NewCampaignPage />);
    expect(screen.getByRole("button", { name: /Anterior/i })).toBeDisabled();
  });

  it("Próximo is disabled when zero recipients (BY_TAG with no tag picked)", () => {
    hoisted.clientsQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 100 } },
      isLoading: false,
    };
    renderWithIntl(<NewCampaignPage />);
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeDisabled();
  });

  it("Próximo enables when ALL audience is picked and clients are present", () => {
    hoisted.clientsQuery = {
      data: {
        data: [
          { id: "c-1", name: "Maria", phone: "+5511999990001" },
          { id: "c-2", name: "Joana", phone: "+5511999990002" },
        ],
        meta: { total: 2, page: 1, limit: 100 },
      },
      isLoading: false,
    };
    renderWithIntl(<NewCampaignPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Todas/i }));
    expect(screen.getByRole("button", { name: /Próximo/i })).not.toBeDisabled();
  });

  it("INDIVIDUAL audience renders one client row + LOADING skeleton", () => {
    hoisted.clientsQuery = { data: undefined, isLoading: true };
    const { container } = renderWithIntl(<NewCampaignPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Individual/i }));
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("toggling a client in INDIVIDUAL mode flips the recipient count", () => {
    hoisted.clientsQuery = {
      data: {
        data: [
          { id: "c-1", name: "Maria", phone: "+5511999990001" },
          { id: "c-2", name: "Joana", phone: "+5511999990002" },
        ],
        meta: { total: 2, page: 1, limit: 100 },
      },
      isLoading: false,
    };
    renderWithIntl(<NewCampaignPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Individual/i }));
    // Counter is "0 destinatários" initially.
    expect(screen.getByText(/^0\s+destinatári/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Maria"));
    expect(screen.getByText(/^1\s+destinatári/i)).toBeInTheDocument();
  });

  it("BY_TAG audience: shows tag chips when tags load", () => {
    hoisted.clientsQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 100 } },
      isLoading: false,
    };
    hoisted.tagsQuery = {
      data: [
        { id: "tag-vip", name: "VIP", color: "#fa0" },
        { id: "tag-active", name: "Ativas", color: null },
      ],
      isLoading: false,
    };
    renderWithIntl(<NewCampaignPage />);
    expect(screen.getByText("VIP")).toBeInTheDocument();
    expect(screen.getByText("Ativas")).toBeInTheDocument();
  });
});
