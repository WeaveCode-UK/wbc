import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Coverage lift — OnboardingChecklist: hides when all milestones complete,
// shows progress with deep-links otherwise.

const hoisted = vi.hoisted(() => ({
  query: { data: undefined as unknown },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    platform: {
      getUnlockedFeatures: { useQuery: () => hoisted.query },
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { renderWithIntl } from "./_test-utils";
import { OnboardingChecklist } from "../onboarding-checklist";

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    hoisted.query = { data: undefined };
  });

  it("renders nothing while query is loading", () => {
    hoisted.query = { data: undefined };
    const { container } = renderWithIntl(<OnboardingChecklist />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when all three milestones are complete", () => {
    hoisted.query = {
      data: {
        hasFirstClient: true,
        hasFirstSale: true,
        hasFirstCampaign: true,
      },
    };
    const { container } = renderWithIntl(<OnboardingChecklist />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 0/3 progress when nothing done — all three CTAs visible", () => {
    hoisted.query = {
      data: {
        hasFirstClient: false,
        hasFirstSale: false,
        hasFirstCampaign: false,
      },
    };
    renderWithIntl(<OnboardingChecklist />);
    expect(screen.getByText("0/3")).toBeInTheDocument();
    // CTA links — one per pending step.
    expect(
      screen.getByRole("link", { name: /Ir para Clientes/i }),
    ).toHaveAttribute("href", "/clients");
    expect(screen.getByRole("link", { name: /Nova venda/i })).toHaveAttribute(
      "href",
      "/sales/new",
    );
    expect(
      screen.getByRole("link", { name: /Nova campanha/i }),
    ).toHaveAttribute("href", "/campaigns/new");
  });

  it("renders 2/3 progress with the completed steps line-throughed", () => {
    hoisted.query = {
      data: {
        hasFirstClient: true,
        hasFirstSale: true,
        hasFirstCampaign: false,
      },
    };
    renderWithIntl(<OnboardingChecklist />);
    expect(screen.getByText("2/3")).toBeInTheDocument();
    // Only one CTA (third step) remains.
    expect(screen.getAllByRole("link", { name: /Nova campanha/i }).length).toBe(
      1,
    );
    expect(
      screen.queryByRole("link", { name: /Ir para Clientes/i }),
    ).not.toBeInTheDocument();
  });
});
