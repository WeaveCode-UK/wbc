import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Coverage lift — BottomNav: pathname drives aria-current, "Mais" toggles
// the secondary menu, Escape closes it.

const hoisted = vi.hoisted(() => ({
  pathname: "/" as string,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => hoisted.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { renderWithIntl } from "./_test-utils";
import { BottomNav } from "../bottom-nav";

describe("BottomNav", () => {
  beforeEach(() => {
    hoisted.pathname = "/";
  });

  it("renders 4 primary nav links + 1 'Mais' button", () => {
    renderWithIntl(<BottomNav />);
    expect(screen.getAllByRole("link").length).toBe(4);
    expect(screen.getByRole("button", { name: /Mais/i })).toBeInTheDocument();
  });

  it("marks current pathname's link with aria-current=page", () => {
    hoisted.pathname = "/clients";
    renderWithIntl(<BottomNav />);
    const clientsLink = screen.getByRole("link", { name: /Clientes/i });
    expect(clientsLink).toHaveAttribute("aria-current", "page");
  });

  it("'Mais' button starts collapsed (aria-expanded=false)", () => {
    renderWithIntl(<BottomNav />);
    expect(screen.getByRole("button", { name: /Mais/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("clicking 'Mais' opens the secondary menu and toggles aria-expanded", () => {
    renderWithIntl(<BottomNav />);
    const trigger = screen.getByRole("button", { name: /Mais/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // Menu items appear (e.g., Configurações).
    expect(
      screen.getByRole("menuitem", { name: /Configurações/i }),
    ).toBeInTheDocument();
  });

  it("Escape closes the open secondary menu", () => {
    renderWithIntl(<BottomNav />);
    const trigger = screen.getByRole("button", { name: /Mais/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
