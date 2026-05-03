import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

// Coverage lift — Badge variants apply tokenised bg/text classes; default
// is "neutral". Lifting one variant per case keeps the matrix focused.

describe("Badge component", () => {
  it("renders children content", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies neutral variant by default", () => {
    render(<Badge>Default</Badge>);
    const el = screen.getByText("Default");
    expect(el.className).toContain("bg-secondary");
  });

  it("applies success variant classes", () => {
    render(<Badge variant="success">OK</Badge>);
    expect(screen.getByText("OK").className).toContain("success-bg");
  });

  it("applies danger variant classes", () => {
    render(<Badge variant="danger">Erro</Badge>);
    expect(screen.getByText("Erro").className).toContain("danger-bg");
  });

  it("applies warning variant classes", () => {
    render(<Badge variant="warning">Atenção</Badge>);
    expect(screen.getByText("Atenção").className).toContain("warning-bg");
  });

  it("applies info variant classes", () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText("Info").className).toContain("info-bg");
  });

  it("appends consumer className", () => {
    render(<Badge className="my-extra">X</Badge>);
    expect(screen.getByText("X").className).toContain("my-extra");
  });
});
