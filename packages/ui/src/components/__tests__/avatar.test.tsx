import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../avatar";

describe("Avatar component", () => {
  it("renders initials from full name", () => {
    render(<Avatar name="Ana Maria Silva" />);
    // splits, takes first letter of each, caps to 2
    expect(screen.getByText("AM")).toBeInTheDocument();
  });

  it("renders initials uppercased even from lowercase name", () => {
    render(<Avatar name="ana ferreira" />);
    expect(screen.getByText("AF")).toBeInTheDocument();
  });

  it("renders <img> when src is provided", () => {
    render(<Avatar name="Maria" src="/foo.png" />);
    const img = screen.getByAltText("Maria") as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.src).toContain("/foo.png");
  });

  it("applies size classes (lg)", () => {
    const { container } = render(<Avatar name="X" size="lg" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("h-12");
  });

  it("uses primary background by default", () => {
    const { container } = render(<Avatar name="X" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.backgroundColor).toContain("var(--color-primary)");
  });

  it("uses classification color when provided (A)", () => {
    const { container } = render(<Avatar name="X" classification="A" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.backgroundColor).toContain("--color-abc-a");
  });

  it("uses classification color when provided (C)", () => {
    const { container } = render(<Avatar name="X" classification="C" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.backgroundColor).toContain("--color-abc-c");
  });
});
