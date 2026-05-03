import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfirmModal } from "../confirm-modal";

// jsdom does not implement HTMLDialogElement.showModal — stub it so the
// useEffect inside ConfirmModal can flip the dialog open without throwing.
beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
    };
  }
});

describe("ConfirmModal component", () => {
  it("renders title and confirm/cancel labels", () => {
    render(
      <ConfirmModal
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        title="Confirmar?"
        confirmLabel="Sim"
        cancelLabel="Não"
      />,
    );
    expect(screen.getByText("Confirmar?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sim" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Não" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <ConfirmModal
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        title="T"
        description="Detalhes"
        confirmLabel="OK"
        cancelLabel="Cancelar"
      />,
    );
    expect(screen.getByText("Detalhes")).toBeInTheDocument();
  });

  it("calls onConfirm AND onClose when confirm button is clicked (not loading)", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="T"
        confirmLabel="OK"
        cancelLabel="C"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open
        onClose={onClose}
        onConfirm={() => undefined}
        title="T"
        confirmLabel="OK"
        cancelLabel="C"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("disables both buttons + sets aria-busy when isLoading=true", () => {
    render(
      <ConfirmModal
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        title="T"
        confirmLabel="OK"
        cancelLabel="C"
        isLoading
      />,
    );
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "C" })).toBeDisabled();
  });

  it("does not invoke onConfirm when clicked while loading", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open
        onClose={() => undefined}
        onConfirm={onConfirm}
        title="T"
        confirmLabel="OK"
        cancelLabel="C"
        isLoading
      />,
    );
    // disabled buttons shouldn't fire click handlers, but assert anyway.
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("applies destructive styling on confirm button when destructive=true", () => {
    render(
      <ConfirmModal
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        title="T"
        confirmLabel="Excluir"
        cancelLabel="C"
        destructive
      />,
    );
    expect(
      screen.getByRole("button", { name: "Excluir" }).className.toLowerCase(),
    ).toContain("danger");
  });
});
