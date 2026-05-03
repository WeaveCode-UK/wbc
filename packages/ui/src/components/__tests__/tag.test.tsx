import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Tag } from "../tag";

describe("Tag component", () => {
  it("renders the label", () => {
    render(<Tag label="VIP" />);
    expect(screen.getByText("VIP")).toBeInTheDocument();
  });

  it("does not render remove button when onRemove is omitted", () => {
    render(<Tag label="X" />);
    expect(
      screen.queryByRole("button", { name: /Remove/i }),
    ).not.toBeInTheDocument();
  });

  it("renders remove button with aria-label when onRemove is provided", () => {
    render(<Tag label="VIP" onRemove={() => undefined} />);
    expect(
      screen.getByRole("button", { name: "Remove VIP" }),
    ).toBeInTheDocument();
  });

  it("calls onRemove when × is clicked", () => {
    const onRemove = vi.fn();
    render(<Tag label="VIP" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove VIP" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("uses provided color tinted background", () => {
    const { container } = render(<Tag label="X" color="#abcdef" />);
    const span = container.firstChild as HTMLElement;
    // jsdom normalises "#abcdef20" → rgba(171, 205, 239, 0.125)
    expect(span.style.backgroundColor).toMatch(/rgba?\(/);
    expect(span.style.color.toLowerCase()).toBe("rgb(171, 205, 239)");
  });

  it("falls back to neutral background when color is omitted", () => {
    const { container } = render(<Tag label="X" />);
    const span = container.firstChild as HTMLElement;
    expect(span.style.backgroundColor).toContain("--color-bg-secondary");
  });
});
