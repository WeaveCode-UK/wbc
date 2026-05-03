import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FunnelChart } from "../funnel-chart";

describe("FunnelChart component", () => {
  const STEPS = [
    { label: "Visitas", value: 100, color: "#aaa" },
    { label: "Leads", value: 60, color: "#bbb" },
    { label: "Vendas", value: 12, color: "#ccc" },
  ];

  it("renders one row per step", () => {
    const { container } = render(<FunnelChart steps={STEPS} />);
    // each row has an inner bar div with backgroundColor
    const bars = Array.from(container.querySelectorAll("div > div")).filter(
      (el) => (el as HTMLElement).style.backgroundColor !== "",
    );
    expect(bars.length).toBe(3);
  });

  it("renders labels and values", () => {
    render(<FunnelChart steps={STEPS} />);
    expect(screen.getByText("Visitas")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("paints first row at 100% width and last row at proportional width", () => {
    const { container } = render(<FunnelChart steps={STEPS} />);
    const bars = Array.from(container.querySelectorAll("div > div")).filter(
      (el) => (el as HTMLElement).style.backgroundColor !== "",
    ) as HTMLElement[];
    expect(bars[0]?.style.width).toBe("100%");
    // 12 / 100 = 12%
    expect(bars[2]?.style.width).toBe("12%");
  });

  it("does not divide-by-zero when all values are zero (clamps max to 1)", () => {
    expect(() =>
      render(
        <FunnelChart
          steps={[
            { label: "A", value: 0, color: "#aaa" },
            { label: "B", value: 0, color: "#bbb" },
          ]}
        />,
      ),
    ).not.toThrow();
  });
});
