import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Coverage lift — WhatsappButton: lazy fetch via tRPC utils, opens wa.me URL.

const hoisted = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      messaging: { generateLink: { fetch: hoisted.fetchMock } },
    }),
  },
}));

import { WhatsappButton } from "../whatsapp-button";

describe("WhatsappButton", () => {
  beforeEach(() => {
    hoisted.fetchMock.mockReset();
  });

  it("renders with the provided label", () => {
    render(<WhatsappButton clientId="c-1" label="Mensagem" />);
    expect(
      screen.getByRole("button", { name: "Mensagem" }),
    ).toBeInTheDocument();
  });

  it("on click — fetches generateLink with default kind=GENERIC and opens URL", async () => {
    hoisted.fetchMock.mockResolvedValueOnce({ url: "https://wa.me/55x" });
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<WhatsappButton clientId="c-1" label="WA" />);
    fireEvent.click(screen.getByText("WA"));
    await waitFor(() => expect(hoisted.fetchMock).toHaveBeenCalled());
    expect(hoisted.fetchMock).toHaveBeenCalledWith({
      clientId: "c-1",
      kind: "GENERIC",
    });
    expect(openSpy).toHaveBeenCalledWith(
      "https://wa.me/55x",
      "_blank",
      "noopener",
    );
    openSpy.mockRestore();
  });

  it("forwards a non-default kind (BIRTHDAY) to the fetch payload", async () => {
    hoisted.fetchMock.mockResolvedValueOnce({ url: "https://wa.me/x" });
    vi.spyOn(window, "open").mockImplementation(() => null);
    render(<WhatsappButton clientId="c-2" label="B" kind="BIRTHDAY" />);
    fireEvent.click(screen.getByText("B"));
    await waitFor(() => expect(hoisted.fetchMock).toHaveBeenCalled());
    const call = hoisted.fetchMock.mock.calls[0];
    if (!call) throw new Error("expected fetch call");
    expect(call[0]).toEqual({ clientId: "c-2", kind: "BIRTHDAY" });
  });

  it("disables button while busy (renders … spinner text)", async () => {
    // Returns a deferred promise so busy stays true while we assert.
    type Deferred = {
      promise: Promise<unknown>;
      resolve: (v: unknown) => void;
    };
    const deferred: Deferred = (() => {
      let res: (v: unknown) => void = () => undefined;
      const promise = new Promise<unknown>((r) => {
        res = r;
      });
      return { promise, resolve: res };
    })();
    hoisted.fetchMock.mockImplementationOnce(() => deferred.promise);
    vi.spyOn(window, "open").mockImplementation(() => null);
    render(<WhatsappButton clientId="c-1" label="WA" />);
    const btn = screen.getByText("WA");
    fireEvent.click(btn);
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("..."),
    );
    expect(screen.getByRole("button")).toBeDisabled();
    // Clean up the pending promise so the test exits promptly.
    deferred.resolve({ url: "x" });
  });
});
