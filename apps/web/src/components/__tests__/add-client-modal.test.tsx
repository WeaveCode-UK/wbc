import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// T4.2 — AddClient modal: validation, disabled-while-submitting, close on success.

const createMutate = vi.fn();
let createState: {
  isPending: boolean;
  error: { message: string } | null;
} = { isPending: false, error: null };
let createSuccessCb: ((client: { id: string; name: string }) => void) | null =
  null;

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    clients: {
      create: {
        useMutation: (opts: {
          onSuccess?: (client: { id: string; name: string }) => void;
          onError?: (err: { message: string }) => void;
        }) => {
          createSuccessCb = opts.onSuccess ?? null;
          return {
            mutate: createMutate,
            isPending: createState.isPending,
            error: createState.error,
          };
        },
      },
      list: { invalidate: vi.fn() },
    },
    useUtils: () => ({ clients: { list: { invalidate: vi.fn() } } }),
  },
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

import { renderWithIntl } from "./_test-utils";
import { AddClientModal } from "../add-client-modal";

function renderModal(
  override: Partial<{
    open: boolean;
    onClose: () => void;
    onCreated: (id: string) => void;
  }> = {},
): { onClose: ReturnType<typeof vi.fn>; onCreated: ReturnType<typeof vi.fn> } {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  renderWithIntl(
    <AddClientModal
      open={override.open ?? true}
      onClose={override.onClose ?? onClose}
      onCreated={override.onCreated ?? onCreated}
    />,
  );
  return { onClose, onCreated };
}

describe("AddClientModal", () => {
  beforeEach(() => {
    createMutate.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    createState = { isPending: false, error: null };
    createSuccessCb = null;
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <AddClientModal open={false} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("save is disabled when name+phone are empty", () => {
    renderModal();
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("save remains disabled with invalid phone (rejects E.164 violation)", () => {
    renderModal();
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    // First textbox = name, then email. Phone is type="tel" — find by label text.
    const nameInput = screen.getByLabelText(/Nome/i, {
      selector: "input",
    }) as HTMLInputElement;
    const phoneInput = screen.getByLabelText(/Telefone/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Maria" } });
    fireEvent.change(phoneInput, { target: { value: "123" } });
    fireEvent.blur(phoneInput);

    expect(screen.getByText(/Use formato internacional/i)).toBeInTheDocument();
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).toBeDisabled();
    // sanity-check: not all textboxes are missing
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("submits with valid name + E.164 phone and triggers mutation", () => {
    renderModal();
    const nameInput = screen.getByLabelText(/Nome/i, {
      selector: "input",
    }) as HTMLInputElement;
    const phoneInput = screen.getByLabelText(/Telefone/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Maria" } });
    fireEvent.change(phoneInput, { target: { value: "+5511999990000" } });

    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);
    expect(createMutate).toHaveBeenCalledWith({
      name: "Maria",
      phone: "+5511999990000",
      email: undefined,
      isLead: false,
    });
  });

  it("disables save button while mutation is pending", () => {
    createState = { isPending: true, error: null };
    renderModal();
    const saveBtn = screen.getByRole("button", { name: /Salvar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("calls onClose and onCreated when mutation succeeds", () => {
    const onClose = vi.fn();
    const onCreated = vi.fn();
    renderWithIntl(
      <AddClientModal open={true} onClose={onClose} onCreated={onCreated} />,
    );
    expect(typeof createSuccessCb).toBe("function");
    createSuccessCb?.({ id: "client-1", name: "Maria" });
    expect(onClose).toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalledWith("client-1");
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("close button (X) calls onClose", () => {
    const onClose = vi.fn();
    renderWithIntl(<AddClientModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Fechar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
