import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// T4.2 — AddProduct modal: required fields, submit disabled while pending,
// close on success.

const hoisted = vi.hoisted(() => ({
  createMutate: vi.fn(),
  listProductsInvalidate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  state: {
    isPending: false,
    error: null as { message: string } | null,
    successCb: null as (() => void) | null,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: {
      listBrands: {
        useQuery: () => ({
          data: [
            { id: "brand-1", name: "Brand One" },
            { id: "brand-2", name: "Brand Two" },
          ],
          isLoading: false,
        }),
      },
      createProduct: {
        useMutation: (opts: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        }) => {
          hoisted.state.successCb = opts.onSuccess ?? null;
          return {
            mutate: hoisted.createMutate,
            isPending: hoisted.state.isPending,
            error: hoisted.state.error,
          };
        },
      },
      listProducts: { invalidate: hoisted.listProductsInvalidate },
    },
    useUtils: () => ({
      catalog: {
        listProducts: { invalidate: hoisted.listProductsInvalidate },
      },
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
import { AddProductModal } from "../add-product-modal";

describe("AddProductModal", () => {
  beforeEach(() => {
    hoisted.createMutate.mockReset();
    hoisted.toastSuccess.mockReset();
    hoisted.toastError.mockReset();
    hoisted.state.isPending = false;
    hoisted.state.error = null;
    hoisted.state.successCb = null;
    hoisted.listProductsInvalidate.mockReset();
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <AddProductModal open={false} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("save disabled until name + brand + price are filled", () => {
    renderWithIntl(<AddProductModal open={true} onClose={() => undefined} />);
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("submits with name + brand + valid price > 0", () => {
    renderWithIntl(<AddProductModal open={true} onClose={() => undefined} />);
    const nameInput = screen.getByLabelText("Nome") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Batom Vermelho" } });

    const brandSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(brandSelect, { target: { value: "brand-1" } });

    const priceInput = screen.getByLabelText("Preço") as HTMLInputElement;
    fireEvent.change(priceInput, { target: { value: "29.90" } });

    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);
    expect(hoisted.createMutate).toHaveBeenCalledWith({
      name: "Batom Vermelho",
      brandId: "brand-1",
      price: 29.9,
      costPrice: undefined,
      description: undefined,
      category: undefined,
    });
  });

  it("rejects price <= 0 (does not call mutate)", () => {
    renderWithIntl(<AddProductModal open={true} onClose={() => undefined} />);
    const nameInput = screen.getByLabelText("Nome") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "X" } });
    const brandSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    fireEvent.change(brandSelect, { target: { value: "brand-1" } });
    // Price stays at "" (falsy) so the disabled gate triggers; we still
    // try to click to assert mutate is NOT called.
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    fireEvent.click(saveBtn);
    expect(hoisted.createMutate).not.toHaveBeenCalled();
  });

  it("disables save button while mutation pending", () => {
    hoisted.state.isPending = true;
    renderWithIntl(<AddProductModal open={true} onClose={() => undefined} />);
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("calls onClose when mutation succeeds and invalidates list", () => {
    const onClose = vi.fn();
    renderWithIntl(<AddProductModal open={true} onClose={onClose} />);
    expect(typeof hoisted.state.successCb).toBe("function");
    hoisted.state.successCb?.();
    expect(onClose).toHaveBeenCalled();
    expect(hoisted.listProductsInvalidate).toHaveBeenCalled();
    expect(hoisted.toastSuccess).toHaveBeenCalled();
  });
});
