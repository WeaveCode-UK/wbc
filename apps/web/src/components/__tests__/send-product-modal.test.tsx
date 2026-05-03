import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

// Coverage lift — SendProductModal: gated by `product` prop, lists clients
// from tRPC, picking a client triggers messaging.generateLink and opens
// the resulting URL.

const hoisted = vi.hoisted(() => ({
  generateLinkFetch: vi.fn(),
  toastError: vi.fn(),
  clientsQuery: {
    data: undefined as unknown,
    isLoading: false,
  } as { data: unknown; isLoading: boolean },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    clients: {
      list: {
        useQuery: () => hoisted.clientsQuery,
      },
    },
    useUtils: () => ({
      messaging: {
        generateLink: { fetch: hoisted.generateLinkFetch },
      },
    }),
  },
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ success: vi.fn(), error: hoisted.toastError }),
}));

import { renderWithIntl } from "./_test-utils";
import { SendProductModal } from "../send-product-modal";

const PRODUCT = {
  id: "p-1",
  name: "Batom",
  price: 19.9,
  description: "Hidratante",
};

describe("SendProductModal", () => {
  beforeEach(() => {
    hoisted.generateLinkFetch.mockReset();
    hoisted.toastError.mockReset();
    hoisted.clientsQuery = { data: undefined, isLoading: true };
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <SendProductModal
        open={false}
        product={PRODUCT}
        onClose={() => undefined}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when product is null even if open", () => {
    const { container } = renderWithIntl(
      <SendProductModal open product={null} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the product name in the dialog header", () => {
    hoisted.clientsQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 30 } },
      isLoading: false,
    };
    renderWithIntl(
      <SendProductModal open product={PRODUCT} onClose={() => undefined} />,
    );
    expect(screen.getByText("Batom")).toBeInTheDocument();
  });

  it("LOADING — shows ListSkeleton", () => {
    hoisted.clientsQuery = { data: undefined, isLoading: true };
    const { container } = renderWithIntl(
      <SendProductModal open product={PRODUCT} onClose={() => undefined} />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("EMPTY — shows the no_results copy when client list is empty", () => {
    hoisted.clientsQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 30 } },
      isLoading: false,
    };
    renderWithIntl(
      <SendProductModal open product={PRODUCT} onClose={() => undefined} />,
    );
    expect(
      screen.getByText(/Nenhum resultado encontrado/i),
    ).toBeInTheDocument();
  });

  it("DATA — renders one button per client", () => {
    hoisted.clientsQuery = {
      data: {
        data: [
          { id: "c-1", name: "Maria", phone: "+5511999990001" },
          { id: "c-2", name: "Joana", phone: "+5511999990002" },
        ],
        meta: { total: 2, page: 1, limit: 30 },
      },
      isLoading: false,
    };
    renderWithIntl(
      <SendProductModal open product={PRODUCT} onClose={() => undefined} />,
    );
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("Joana")).toBeInTheDocument();
  });

  it("clicking a client fetches generateLink, opens window.open, then onClose", async () => {
    hoisted.clientsQuery = {
      data: {
        data: [{ id: "c-1", name: "Maria", phone: "+5511999990001" }],
        meta: { total: 1, page: 1, limit: 30 },
      },
      isLoading: false,
    };
    hoisted.generateLinkFetch.mockResolvedValueOnce({
      url: "https://wa.me/5511999990001?text=hi",
    });
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const onClose = vi.fn();

    renderWithIntl(
      <SendProductModal open product={PRODUCT} onClose={onClose} />,
    );
    fireEvent.click(screen.getByText("Maria"));

    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    expect(hoisted.generateLinkFetch).toHaveBeenCalledWith({
      clientId: "c-1",
      kind: "GENERIC",
      customMessage: expect.stringContaining("Batom"),
    });
    expect(openSpy).toHaveBeenCalledWith(
      "https://wa.me/5511999990001?text=hi",
      "_blank",
      "noopener,noreferrer",
    );
    expect(onClose).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("shows toast.error when generateLink rejects", async () => {
    hoisted.clientsQuery = {
      data: {
        data: [{ id: "c-1", name: "Maria", phone: "+5511999990001" }],
        meta: { total: 1, page: 1, limit: 30 },
      },
      isLoading: false,
    };
    hoisted.generateLinkFetch.mockRejectedValueOnce(new Error("offline"));
    renderWithIntl(
      <SendProductModal open product={PRODUCT} onClose={() => undefined} />,
    );
    fireEvent.click(screen.getByText("Maria"));
    await waitFor(() => expect(hoisted.toastError).toHaveBeenCalled());
    expect(hoisted.toastError).toHaveBeenCalledWith("offline");
  });

  it("close button (X) calls onClose", () => {
    hoisted.clientsQuery = {
      data: { data: [], meta: { total: 0, page: 1, limit: 30 } },
      isLoading: false,
    };
    const onClose = vi.fn();
    renderWithIntl(
      <SendProductModal open product={PRODUCT} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Fechar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
