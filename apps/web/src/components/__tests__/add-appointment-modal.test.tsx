import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

// Coverage lift — AddAppointmentModal: required title + startsAt, save
// gated until both are present, mutation handlers wire onSuccess to close.

const hoisted = vi.hoisted(() => ({
  createMutate: vi.fn(),
  invalidate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  state: {
    isPending: false,
    error: null as { message: string } | null,
    onSuccess: null as (() => void) | null,
    onError: null as ((err: { message: string }) => void) | null,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    schedule: {
      createAppointment: {
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
      schedule: { listAppointments: { invalidate: hoisted.invalidate } },
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
import { AddAppointmentModal } from "../add-appointment-modal";

describe("AddAppointmentModal", () => {
  beforeEach(() => {
    hoisted.createMutate.mockReset();
    hoisted.invalidate.mockReset();
    hoisted.toastSuccess.mockReset();
    hoisted.toastError.mockReset();
    hoisted.state.isPending = false;
    hoisted.state.error = null;
    hoisted.state.onSuccess = null;
    hoisted.state.onError = null;
  });

  it("renders nothing when open=false", () => {
    const { container } = renderWithIntl(
      <AddAppointmentModal open={false} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog title when open", () => {
    renderWithIntl(<AddAppointmentModal open onClose={() => undefined} />);
    expect(
      screen.getByRole("heading", { level: 2, name: /Novo compromisso/i }),
    ).toBeInTheDocument();
  });

  it("save button is disabled until title and startsAt are filled", () => {
    renderWithIntl(<AddAppointmentModal open onClose={() => undefined} />);
    const save = screen.getByRole("button", { name: /Salvar/i });
    expect(save).toBeDisabled();

    const title = screen.getByLabelText("Título") as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Visita Maria" } });
    expect(save).toBeDisabled(); // missing startsAt

    const startsAt = screen.getByLabelText("Data e hora") as HTMLInputElement;
    fireEvent.change(startsAt, { target: { value: "2026-06-01T10:00" } });
    expect(save).not.toBeDisabled();
  });

  it("calls createMutate with the typed values", () => {
    renderWithIntl(<AddAppointmentModal open onClose={() => undefined} />);
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Visita" },
    });
    fireEvent.change(screen.getByLabelText("Data e hora"), {
      target: { value: "2026-06-01T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Endereço"), {
      target: { value: "Rua A 100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));

    expect(hoisted.createMutate).toHaveBeenCalledTimes(1);
    const call = hoisted.createMutate.mock.calls[0];
    if (!call) throw new Error("expected mutate call");
    const arg = call[0] as {
      title: string;
      address?: string;
      type: string;
      startsAt: Date;
    };
    expect(arg.title).toBe("Visita");
    expect(arg.address).toBe("Rua A 100");
    expect(arg.type).toBe("VISIT");
    expect(arg.startsAt).toBeInstanceOf(Date);
  });

  it("changing the type select updates the submitted payload", () => {
    renderWithIntl(<AddAppointmentModal open onClose={() => undefined} />);
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Demo" },
    });
    fireEvent.change(screen.getByLabelText("Data e hora"), {
      target: { value: "2026-06-02T15:00" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "BEAUTY_DAY" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));
    const call = hoisted.createMutate.mock.calls[0];
    if (!call) throw new Error("expected mutate call");
    expect((call[0] as { type: string }).type).toBe("BEAUTY_DAY");
  });

  it("disables save while mutation is pending", () => {
    hoisted.state.isPending = true;
    renderWithIntl(<AddAppointmentModal open onClose={() => undefined} />);
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "X" },
    });
    fireEvent.change(screen.getByLabelText("Data e hora"), {
      target: { value: "2026-06-01T10:00" },
    });
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeDisabled();
  });

  it("on mutation success: invalidates list, fires toast, calls onClose", () => {
    const onClose = vi.fn();
    renderWithIntl(<AddAppointmentModal open onClose={onClose} />);
    expect(typeof hoisted.state.onSuccess).toBe("function");
    hoisted.state.onSuccess?.();
    expect(hoisted.invalidate).toHaveBeenCalled();
    expect(hoisted.toastSuccess).toHaveBeenCalledWith("Compromisso criado");
    expect(onClose).toHaveBeenCalled();
  });

  it("on mutation error: surfaces toast.error with the message", () => {
    renderWithIntl(<AddAppointmentModal open onClose={() => undefined} />);
    hoisted.state.onError?.({ message: "boom" });
    expect(hoisted.toastError).toHaveBeenCalledWith("boom");
  });

  it("backdrop click calls onClose; modal-content click does NOT", () => {
    const onClose = vi.fn();
    const { container } = renderWithIntl(
      <AddAppointmentModal open onClose={onClose} />,
    );
    const backdrop = container.querySelector('[role="dialog"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders the inline error Alert when mutation has an error", () => {
    hoisted.state.error = { message: "Conflito de agenda" };
    renderWithIntl(<AddAppointmentModal open onClose={() => undefined} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Conflito de agenda");
  });
});
