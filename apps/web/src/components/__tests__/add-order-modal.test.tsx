import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// Coverage lift — AddOrderModal: brand select required, items array can grow
// and shrink, only fully-filled rows reach the mutation payload.

const hoisted = vi.hoisted(() => ({
  createMutate: vi.fn(),
  invalidate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  brands: [
    { id: "brand-1", name: "Brand One" },
    { id: "brand-2", name: "Brand Two" },
  ] as { id: string; name: string }[],
  state: {
    isPending: false,
    error: null as { message: string } | null,
    onSuccess: null as (() => void) | null,
    onError: null as ((err: { message: string }) => void) | null,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: {
      listBrands: {
        useQuery: () => ({ data: hoisted.brands, isLoading: false }),
      },
    },
    inventory: {
      createOrder: {
        useMutation: (opts: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        }) => {
          hoisted.state.onSuccess = opts.onSuccess ?? null;
          hoisted.state.onError = opts.onError ?? null;
          return {
            mutate: hoisted.createMutate,
            isPending: hoisted.state.isPending,
            error: hoisted.state.error,
          };
        },
      },
    },
    useUtils: () => ({
      inventory: { listOrders: { invalidate: hoisted.invalidate } },
    }),
  },
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({
    success: hoisted.toastSuccess,
    error: hoisted.toastError,
  }),
}));

import { renderWithIntl } from "./_test-utils";
import { AddOrderModal } from "../add-order-modal";

describe("AddOrderModal", () => {
  beforeEach(() => {
    hoisted.createMutate.mockReset();
    hoisted.invalidate.mockReset();
    hoisted.toastSuccess.mockReset();
    hoisted.toastError.mockReset();
    hoisted.state.isPending = false;
    hoisted.state.error = null;
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <AddOrderModal open={false} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders heading and brand select with options", () => {
    renderWithIntl(<AddOrderModal open onClose={() => undefined} />);
    expect(
      screen.getByRole("heading", { name: /Novo pedido/i, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Brand One")).toBeInTheDocument();
    expect(screen.getByText("Brand Two")).toBeInTheDocument();
  });

  it("save is disabled when brand is not picked", () => {
    renderWithIntl(<AddOrderModal open onClose={() => undefined} />);
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeDisabled();
  });

  it("addItem button appends a new draft row", () => {
    renderWithIntl(<AddOrderModal open onClose={() => undefined} />);
    // initial: 1 item row → 1 product-name input
    expect(screen.getAllByPlaceholderText("Produto")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Adicionar/i }));
    expect(screen.getAllByPlaceholderText("Produto")).toHaveLength(2);
  });

  it("delete button is disabled when only one row remains", () => {
    renderWithIntl(<AddOrderModal open onClose={() => undefined} />);
    const delBtn = screen.getByRole("button", { name: /Excluir/i });
    expect(delBtn).toBeDisabled();
  });

  it("submits only fully-filled rows to mutate", () => {
    renderWithIntl(<AddOrderModal open onClose={() => undefined} />);
    // pick brand
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "brand-1" },
    });
    // first row: fill all
    const productInput = screen.getAllByPlaceholderText("Produto")[0];
    const qtyInput = screen.getAllByPlaceholderText("Quantidade")[0];
    const costInput = screen.getAllByPlaceholderText("Custo unitário")[0];
    if (!productInput || !qtyInput || !costInput) {
      throw new Error("inputs not found");
    }
    fireEvent.change(productInput, { target: { value: "Sérum X" } });
    fireEvent.change(qtyInput, { target: { value: "3" } });
    fireEvent.change(costInput, { target: { value: "12.50" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    expect(hoisted.createMutate).toHaveBeenCalledWith({
      brandId: "brand-1",
      items: [{ productName: "Sérum X", quantity: 3, unitCost: 12.5 }],
      notes: undefined,
    });
  });

  it("does not call mutate when the only row is incomplete", () => {
    renderWithIntl(<AddOrderModal open onClose={() => undefined} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "brand-1" },
    });
    // Leave fields empty.
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    expect(hoisted.createMutate).not.toHaveBeenCalled();
  });

  it("on success: invalidates, toasts, calls onClose", () => {
    const onClose = vi.fn();
    renderWithIntl(<AddOrderModal open onClose={onClose} />);
    hoisted.state.onSuccess?.();
    expect(hoisted.invalidate).toHaveBeenCalled();
    expect(hoisted.toastSuccess).toHaveBeenCalledWith("Pedido criado");
    expect(onClose).toHaveBeenCalled();
  });

  it("on error: forwards message to toast.error", () => {
    renderWithIntl(<AddOrderModal open onClose={() => undefined} />);
    hoisted.state.onError?.({ message: "BAD" });
    expect(hoisted.toastError).toHaveBeenCalledWith("BAD");
  });
});
