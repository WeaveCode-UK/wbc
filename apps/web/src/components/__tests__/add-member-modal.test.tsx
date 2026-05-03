import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// Coverage lift — AddMemberModal: required name + phone in E.164 format,
// inline validation on blur, save gated until both valid.

const hoisted = vi.hoisted(() => ({
  addMutate: vi.fn(),
  invalidateMembers: vi.fn(),
  invalidateRanking: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  state: {
    isPending: false,
    error: null as { message: string } | null,
    onSuccess: null as ((m: { name?: string }) => void) | null,
    onError: null as ((err: { message: string }) => void) | null,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    team: {
      addMember: {
        useMutation: (opts: {
          onSuccess?: (m: { name?: string }) => void;
          onError?: (err: { message: string }) => void;
        }) => {
          hoisted.state.onSuccess = opts.onSuccess ?? null;
          hoisted.state.onError = opts.onError ?? null;
          return {
            mutate: hoisted.addMutate,
            isPending: hoisted.state.isPending,
            error: hoisted.state.error,
          };
        },
      },
    },
    useUtils: () => ({
      team: {
        listMembers: { invalidate: hoisted.invalidateMembers },
        getRanking: { invalidate: hoisted.invalidateRanking },
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
import { AddMemberModal } from "../add-member-modal";

describe("AddMemberModal", () => {
  beforeEach(() => {
    hoisted.addMutate.mockReset();
    hoisted.invalidateMembers.mockReset();
    hoisted.invalidateRanking.mockReset();
    hoisted.toastSuccess.mockReset();
    hoisted.toastError.mockReset();
    hoisted.state.isPending = false;
    hoisted.state.error = null;
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <AddMemberModal open={false} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("save disabled until both name and phone provided", () => {
    renderWithIntl(<AddMemberModal open onClose={() => undefined} />);
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeDisabled();
  });

  it("phone validation surfaces error on blur for non-E164 input", () => {
    renderWithIntl(<AddMemberModal open onClose={() => undefined} />);
    const phone = screen.getByLabelText("Telefone") as HTMLInputElement;
    fireEvent.change(phone, { target: { value: "1234" } });
    fireEvent.blur(phone);
    expect(screen.getByText(/Use formato internacional/i)).toBeInTheDocument();
  });

  it("submits with valid name + E.164 phone and default role=CONSULTANT", () => {
    renderWithIntl(<AddMemberModal open onClose={() => undefined} />);
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "+5511999990000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    expect(hoisted.addMutate).toHaveBeenCalledWith({
      name: "Ana",
      phone: "+5511999990000",
      role: "CONSULTANT",
    });
  });

  it("changing the role select forwards the new role to the payload", () => {
    renderWithIntl(<AddMemberModal open onClose={() => undefined} />);
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Bia" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "+5511999990001" },
    });
    fireEvent.change(screen.getByLabelText("Papel"), {
      target: { value: "ADMIN" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    const call = hoisted.addMutate.mock.calls[0];
    if (!call) throw new Error("expected mutate call");
    expect((call[0] as { role: string }).role).toBe("ADMIN");
  });

  it("on success: invalidates queries, toasts, calls onClose", () => {
    const onClose = vi.fn();
    renderWithIntl(<AddMemberModal open onClose={onClose} />);
    hoisted.state.onSuccess?.({ name: "Ana" });
    expect(hoisted.invalidateMembers).toHaveBeenCalled();
    expect(hoisted.invalidateRanking).toHaveBeenCalled();
    expect(hoisted.toastSuccess).toHaveBeenCalledWith("Ana adicionada");
    expect(onClose).toHaveBeenCalled();
  });

  it("on error: passes message to toast.error", () => {
    renderWithIntl(<AddMemberModal open onClose={() => undefined} />);
    hoisted.state.onError?.({ message: "rate-limited" });
    expect(hoisted.toastError).toHaveBeenCalledWith("rate-limited");
  });

  it("close button (X) calls onClose", () => {
    const onClose = vi.fn();
    renderWithIntl(<AddMemberModal open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Fechar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
