import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// T4.2 — AddExpense modal: required description+amount, mutate gating,
// disabled while pending.

const hoisted = vi.hoisted(() => ({
  createMutate: vi.fn(),
  invalidateDashboard: vi.fn(),
  invalidateExpenses: vi.fn(),
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
    finance: {
      createExpense: {
        useMutation: (opts: { onSuccess?: () => void }) => {
          hoisted.state.successCb = opts.onSuccess ?? null;
          return {
            mutate: hoisted.createMutate,
            isPending: hoisted.state.isPending,
            error: hoisted.state.error,
          };
        },
      },
      getDashboard: { invalidate: hoisted.invalidateDashboard },
      listExpenses: { invalidate: hoisted.invalidateExpenses },
    },
    useUtils: () => ({
      finance: {
        getDashboard: { invalidate: hoisted.invalidateDashboard },
        listExpenses: { invalidate: hoisted.invalidateExpenses },
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
import { AddExpenseModal } from "../add-expense-modal";

describe("AddExpenseModal", () => {
  beforeEach(() => {
    hoisted.createMutate.mockReset();
    hoisted.toastSuccess.mockReset();
    hoisted.state.isPending = false;
    hoisted.state.error = null;
    hoisted.state.successCb = null;
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <AddExpenseModal open={false} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("save disabled while description+amount empty", () => {
    renderWithIntl(<AddExpenseModal open={true} onClose={() => undefined} />);
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("clicking save with no values does NOT call mutate", () => {
    renderWithIntl(<AddExpenseModal open={true} onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    expect(hoisted.createMutate).not.toHaveBeenCalled();
  });

  it("submits with description + amount + default category 'operacional'", () => {
    renderWithIntl(<AddExpenseModal open={true} onClose={() => undefined} />);
    const desc = screen.getByLabelText("Descrição") as HTMLInputElement;
    fireEvent.change(desc, { target: { value: "Anúncios" } });
    const amount = screen.getByLabelText("Valor") as HTMLInputElement;
    fireEvent.change(amount, { target: { value: "150.00" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    expect(hoisted.createMutate).toHaveBeenCalledTimes(1);
    const arg = hoisted.createMutate.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(arg.description).toBe("Anúncios");
    expect(arg.amount).toBe(150);
    expect(arg.category).toBe("operacional");
    expect(arg.date).toBeInstanceOf(Date);
  });

  it("disables save while mutation pending", () => {
    hoisted.state.isPending = true;
    renderWithIntl(<AddExpenseModal open={true} onClose={() => undefined} />);
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("calls onClose on success", () => {
    const onClose = vi.fn();
    renderWithIntl(<AddExpenseModal open={true} onClose={onClose} />);
    hoisted.state.successCb?.();
    expect(onClose).toHaveBeenCalled();
    expect(hoisted.toastSuccess).toHaveBeenCalled();
  });
});
