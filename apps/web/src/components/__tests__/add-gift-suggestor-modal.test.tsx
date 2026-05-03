import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// T4.2 — AddGiftSuggestor modal: validation (E.164 phone), submit gating,
// disabled while pending, close on success.

const hoisted = vi.hoisted(() => ({
  addMutate: vi.fn(),
  invalidate: vi.fn(),
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
    clients: {
      addGiftSuggestor: {
        useMutation: (opts: { onSuccess?: () => void }) => {
          hoisted.state.successCb = opts.onSuccess ?? null;
          return {
            mutate: hoisted.addMutate,
            isPending: hoisted.state.isPending,
            error: hoisted.state.error,
          };
        },
      },
      listGiftSuggestors: { invalidate: hoisted.invalidate },
    },
    useUtils: () => ({
      clients: { listGiftSuggestors: { invalidate: hoisted.invalidate } },
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
import { AddGiftSuggestorModal } from "../add-gift-suggestor-modal";

describe("AddGiftSuggestorModal", () => {
  beforeEach(() => {
    hoisted.addMutate.mockReset();
    hoisted.toastSuccess.mockReset();
    hoisted.state.isPending = false;
    hoisted.state.error = null;
    hoisted.state.successCb = null;
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <AddGiftSuggestorModal
        open={false}
        clientId="c-1"
        onClose={() => undefined}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("save disabled when name+phone empty", () => {
    renderWithIntl(
      <AddGiftSuggestorModal
        open={true}
        clientId="c-1"
        onClose={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeDisabled();
  });

  it("rejects invalid phone with inline error", () => {
    renderWithIntl(
      <AddGiftSuggestorModal
        open={true}
        clientId="c-1"
        onClose={() => undefined}
      />,
    );
    const phone = screen.getByLabelText(/Telefone/i) as HTMLInputElement;
    fireEvent.change(phone, { target: { value: "abc" } });
    fireEvent.blur(phone);
    expect(screen.getByText(/Use formato internacional/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeDisabled();
  });

  it("submits with name + valid E.164 phone, includes clientId", () => {
    renderWithIntl(
      <AddGiftSuggestorModal
        open={true}
        clientId="client-99"
        onClose={() => undefined}
      />,
    );
    const name = screen.getByLabelText("Nome") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "João" } });
    const phone = screen.getByLabelText(/Telefone/i) as HTMLInputElement;
    fireEvent.change(phone, { target: { value: "+5511999990000" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    expect(hoisted.addMutate).toHaveBeenCalledWith({
      clientId: "client-99",
      suggestorName: "João",
      suggestorPhone: "+5511999990000",
    });
  });

  it("calls onClose on success and invalidates list for this clientId", () => {
    const onClose = vi.fn();
    renderWithIntl(
      <AddGiftSuggestorModal
        open={true}
        clientId="client-99"
        onClose={onClose}
      />,
    );
    hoisted.state.successCb?.();
    expect(onClose).toHaveBeenCalled();
    expect(hoisted.invalidate).toHaveBeenCalledWith({ clientId: "client-99" });
    expect(hoisted.toastSuccess).toHaveBeenCalled();
  });

  it("clicking close button (X) calls onClose", () => {
    const onClose = vi.fn();
    renderWithIntl(
      <AddGiftSuggestorModal open={true} clientId="c-1" onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Fechar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
