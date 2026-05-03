import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { DataRightsLink } from "../data-rights-link";

describe("DataRightsLink", () => {
  it("renders link to /privacy-policy#direitos", () => {
    render(<DataRightsLink />);
    const link = screen.getByRole("link", { name: /LGPD art\. 18-22/i });
    expect(link).toHaveAttribute("href", "/privacy-policy#direitos");
  });

  it("appends consumer className", () => {
    const { container } = render(<DataRightsLink className="extra" />);
    expect((container.firstChild as HTMLElement).className).toContain("extra");
  });
});
