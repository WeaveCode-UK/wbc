import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// Coverage lift — /messaging/templates 4-state surface plus tab toggle
// (personal ↔ community) and create flow gating.

const hoisted = vi.hoisted(() => ({
  listQuery: { data: undefined as unknown, isLoading: true },
  communityQuery: { data: undefined as unknown, isLoading: false },
  createMutate: vi.fn(),
  delMutate: vi.fn(),
  shareMutate: vi.fn(),
  invalidateList: vi.fn(),
  invalidateCommunity: vi.fn(),
  state: {
    createPending: false,
    createError: null as { message: string } | null,
    sharePending: false,
    onSuccess: null as (() => void) | null,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    messaging: {
      listTemplates: { useQuery: () => hoisted.listQuery },
      listCommunityTemplates: { useQuery: () => hoisted.communityQuery },
      createTemplate: {
        useMutation: (opts: { onSuccess?: () => void }) => {
          hoisted.state.onSuccess = opts.onSuccess ?? null;
          return {
            mutate: hoisted.createMutate,
            isPending: hoisted.state.createPending,
            error: hoisted.state.createError,
          };
        },
      },
      deleteTemplate: {
        useMutation: () => ({
          mutate: hoisted.delMutate,
          isPending: false,
          error: null,
        }),
      },
      shareToFeed: {
        useMutation: () => ({
          mutate: hoisted.shareMutate,
          isPending: hoisted.state.sharePending,
          error: null,
        }),
      },
    },
    useUtils: () => ({
      messaging: {
        listTemplates: { invalidate: hoisted.invalidateList },
        listCommunityTemplates: { invalidate: hoisted.invalidateCommunity },
      },
    }),
  },
}));

import { renderWithIntl } from "../../components/__tests__/_test-utils";
import TemplatesPage from "../(dashboard)/messaging/templates/page";

describe("TemplatesPage — async surface + tabs", () => {
  beforeEach(() => {
    hoisted.createMutate.mockReset();
    hoisted.delMutate.mockReset();
    hoisted.shareMutate.mockReset();
    hoisted.invalidateList.mockReset();
    hoisted.invalidateCommunity.mockReset();
    hoisted.listQuery = { data: undefined, isLoading: true };
    hoisted.communityQuery = { data: undefined, isLoading: false };
    hoisted.state.createPending = false;
    hoisted.state.createError = null;
    hoisted.state.sharePending = false;
  });

  it("LOADING — renders ListSkeleton in the personal tab", () => {
    const { container } = renderWithIntl(<TemplatesPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("EMPTY — empty state shows when list resolves with []", () => {
    hoisted.listQuery = { data: [], isLoading: false };
    renderWithIntl(<TemplatesPage />);
    // EmptyState title comes from messaging.templates_empty
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("DATA — renders one row per personal template", () => {
    hoisted.listQuery = {
      data: [
        { id: "t-1", name: "Promo", category: "PROMO", text: "Hi" },
        {
          id: "t-2",
          name: "System",
          category: "SYS",
          text: "Welcome",
          isSystem: true,
        },
      ],
      isLoading: false,
    };
    renderWithIntl(<TemplatesPage />);
    expect(screen.getByText("Promo")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("create button is disabled until name AND text are typed", () => {
    hoisted.listQuery = { data: [], isLoading: false };
    renderWithIntl(<TemplatesPage />);
    const create = screen.getByRole("button", { name: /Criar/i });
    expect(create).toBeDisabled();
    // The first input has placeholder "Nome" (template_name_placeholder).
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "X" },
    });
    expect(create).toBeDisabled();
    // The textarea placeholder resolves to "Mensagem (use {{nome}})".
    fireEvent.change(screen.getByPlaceholderText(/Mensagem \(use/i), {
      target: { value: "msg" },
    });
    expect(create).not.toBeDisabled();
  });

  it("clicking Criar invokes createMutate with name+category+text payload", () => {
    hoisted.listQuery = { data: [], isLoading: false };
    renderWithIntl(<TemplatesPage />);
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "T" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Mensagem \(use/i), {
      target: { value: "Hi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Criar/i }));
    expect(hoisted.createMutate).toHaveBeenCalledWith({
      name: "T",
      category: "PROMOTION",
      text: "Hi",
    });
  });

  it("switching to Comunidade tab shows community templates", () => {
    hoisted.listQuery = { data: [], isLoading: false };
    hoisted.communityQuery = {
      data: [
        { id: "ct-1", text: "Comunitário 1", topic: "Promoção", likes: 9 },
      ],
      isLoading: false,
    };
    renderWithIntl(<TemplatesPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Comunidade/i }));
    expect(screen.getByText("Comunitário 1")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });
});
