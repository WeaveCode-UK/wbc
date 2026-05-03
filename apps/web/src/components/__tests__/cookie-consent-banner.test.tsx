import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Coverage lift — CookieConsentBanner: localStorage gating, accept-all vs
// essential-only persistence, both dismiss the banner.

const STORAGE_KEY = "wbc-cookie-consent";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { CookieConsentBanner } from "../cookie-consent-banner";

// jsdom in this repo ships without a writable localStorage (the harness
// passes --localstorage-file=<unset>). Install a minimal in-memory shim
// for the duration of these tests.
const memStore = new Map<string, string>();
const memStorage: Storage = {
  get length() {
    return memStore.size;
  },
  clear: () => memStore.clear(),
  getItem: (k: string) => memStore.get(k) ?? null,
  key: (i: number) => Array.from(memStore.keys())[i] ?? null,
  removeItem: (k: string) => memStore.delete(k),
  setItem: (k: string, v: string) => {
    memStore.set(k, v);
  },
};

Object.defineProperty(window, "localStorage", {
  value: memStorage,
  configurable: true,
});

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    memStore.clear();
  });

  it("renders the banner copy when no preferences are stored", () => {
    render(<CookieConsentBanner />);
    expect(
      screen.getByRole("region", { name: /Cookie consent/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Política de Privacidade/i)).toBeInTheDocument();
  });

  it("does not render when preferences already exist in localStorage", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        essential: true,
        analytics: true,
        acceptedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("Aceitar todos persists analytics=true and dismisses the banner", () => {
    const { container } = render(<CookieConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: /Aceitar todos/i }));
    expect(container.firstChild).toBeNull();
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    expect(stored.analytics).toBe(true);
    expect(stored.essential).toBe(true);
  });

  it("Só essenciais persists analytics=false and dismisses the banner", () => {
    const { container } = render(<CookieConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: /Só essenciais/i }));
    expect(container.firstChild).toBeNull();
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    expect(stored.analytics).toBe(false);
    expect(stored.essential).toBe(true);
  });

  it("ignores corrupted localStorage payloads (renders banner anyway)", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json");
    render(<CookieConsentBanner />);
    expect(
      screen.getByRole("region", { name: /Cookie consent/i }),
    ).toBeInTheDocument();
  });
});
