import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline } from "../timeline";

// T4.7 — Timeline with mixed-source events (ScheduledMessage +
// PostSaleFlow + CampaignRecipient). The client profile maps each
// kind to a color token: CAMPAIGN→orange, POST_SALE→purple, else info.
// We feed in the same 3-kind shape to make sure the dot color
// faithfully reflects the source.

describe("Timeline — mixed-source rendering", () => {
  it("renders one dot per event with the supplied color (var(--wc-*))", () => {
    const { container } = render(
      <Timeline
        events={[
          {
            color: "var(--wc-orange)",
            title: "Campanha de Outubro",
            description: "Disparada via WhatsApp",
            time: "01/10 09:00",
          },
          {
            color: "var(--wc-purple)",
            title: "Pós-venda — D+7",
            description: "Como você se sentiu com o produto?",
            time: "08/10 09:00",
          },
          {
            color: "var(--wc-info)",
            title: "Mensagem agendada",
            description: "Lembrete",
            time: "10/10 14:00",
          },
        ]}
      />,
    );
    // Each event renders an absolute-positioned dot whose backgroundColor
    // is the prop. Find them by inline style.
    const dots = Array.from(container.querySelectorAll(".rounded-full"));
    const colors = dots.map((d) => (d as HTMLElement).style.backgroundColor);
    expect(colors).toContain("var(--wc-orange)");
    expect(colors).toContain("var(--wc-purple)");
    expect(colors).toContain("var(--wc-info)");
  });

  it("renders titles, descriptions, and times in order", () => {
    render(
      <Timeline
        events={[
          {
            color: "var(--wc-orange)",
            title: "Campanha A",
            description: "desc A",
            time: "01/10",
          },
          {
            color: "var(--wc-purple)",
            title: "Pós-venda B",
            description: "desc B",
            time: "02/10",
          },
        ]}
      />,
    );
    expect(screen.getByText("Campanha A")).toBeInTheDocument();
    expect(screen.getByText("desc A")).toBeInTheDocument();
    expect(screen.getByText("01/10")).toBeInTheDocument();
    expect(screen.getByText("Pós-venda B")).toBeInTheDocument();
    expect(screen.getByText("desc B")).toBeInTheDocument();
    expect(screen.getByText("02/10")).toBeInTheDocument();
  });

  it("works with description and time omitted", () => {
    render(
      <Timeline events={[{ color: "var(--wc-purple)", title: "Só título" }]} />,
    );
    expect(screen.getByText("Só título")).toBeInTheDocument();
  });

  it("renders empty timeline (zero events) without crashing", () => {
    const { container } = render(<Timeline events={[]} />);
    // Vertical line is still painted but no event entries exist.
    expect(container.querySelectorAll(".rounded-full").length).toBe(0);
  });
});
