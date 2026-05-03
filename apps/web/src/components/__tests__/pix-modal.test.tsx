import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Coverage lift — PixModal: gated by `code` prop, renders pre-rendered
// base64 QR if provided, copies to clipboard on button press.

import { PixModal } from "../pix-modal";

describe("PixModal", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("renders nothing when code is null", () => {
    const { container } = render(
      <PixModal code={null} onClose={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the PIX code text and the default caption", () => {
    render(<PixModal code="00020126ABC" onClose={() => undefined} />);
    expect(screen.getByText("00020126ABC")).toBeInTheDocument();
    expect(
      screen.getByText(/Mande o QR ou cole o código no WhatsApp/i),
    ).toBeInTheDocument();
  });

  it("uses provided caption when passed", () => {
    render(
      <PixModal
        code="00020126ABC"
        caption="PIX dinâmico — pagamento único"
        onClose={() => undefined}
      />,
    );
    expect(
      screen.getByText("PIX dinâmico — pagamento único"),
    ).toBeInTheDocument();
  });

  it("renders the pre-rendered base64 QR when qrCodeBase64 is provided", async () => {
    render(
      <PixModal
        code="00020126ABC"
        qrCodeBase64="iVBORw0KGgoBASE64=="
        onClose={() => undefined}
      />,
    );
    const img = (await screen.findByAltText("QR Code PIX")) as HTMLImageElement;
    expect(img.src).toContain("data:image/png;base64,iVBORw0KGgoBASE64==");
  });

  it("Fechar button calls onClose", () => {
    const onClose = vi.fn();
    render(
      <PixModal code="00020126ABC" qrCodeBase64="abc" onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("Copiar código button writes to clipboard and fires onCopied", async () => {
    const onCopied = vi.fn();
    render(
      <PixModal
        code="000200001"
        qrCodeBase64="abc"
        onClose={() => undefined}
        onCopied={onCopied}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Copiar código/i }));
    await waitFor(() => expect(onCopied).toHaveBeenCalled());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("000200001");
  });
});
