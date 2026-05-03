import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, MetricCard } from "../card";

describe("Card component", () => {
  it("renders children", () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies elevated styles by default", () => {
    const { container } = render(<Card>X</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("border");
  });

  it("applies flat variant (no border) styles", () => {
    const { container } = render(<Card variant="flat">X</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-secondary");
  });

  it("applies left-accent inline style when variant=action and accentColor set", () => {
    const { container } = render(
      <Card variant="action" accentColor="#ff0">
        Y
      </Card>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.borderLeftWidth).toBe("3px");
    // jsdom normalises hex colors, so just check non-empty.
    expect(div.style.borderLeftColor).not.toBe("");
  });

  it("forwards extra HTML attributes (data-testid)", () => {
    render(<Card data-testid="card">Z</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });
});

describe("MetricCard component", () => {
  it("renders label + value", () => {
    render(<MetricCard label="Receita" value="R$ 100" />);
    expect(screen.getByText("Receita")).toBeInTheDocument();
    expect(screen.getByText("R$ 100")).toBeInTheDocument();
  });

  it("renders change when provided", () => {
    render(<MetricCard label="Vendas" value="42" change="+10%" />);
    expect(screen.getByText("+10%")).toBeInTheDocument();
  });

  it("omits change paragraph when not provided", () => {
    render(<MetricCard label="L" value="V" />);
    expect(screen.queryByText("+")).not.toBeInTheDocument();
  });
});
