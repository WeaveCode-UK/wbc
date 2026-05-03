import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListSkeleton } from "../list-skeleton";

describe("ListSkeleton component", () => {
  it("renders 6 placeholder rows by default", () => {
    const { container } = render(<ListSkeleton />);
    // role=status wrapper + 6 children + sr-only text
    expect(container.querySelectorAll(".animate-pulse").length).toBe(6);
  });

  it("respects count prop", () => {
    const { container } = render(<ListSkeleton count={3} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
  });

  it("renders status role with aria-busy=true and Loading… sr-only text", () => {
    render(<ListSkeleton count={1} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(/Loading…/)).toBeInTheDocument();
  });

  it("uses tall card variant when variant=card", () => {
    const { container } = render(<ListSkeleton variant="card" count={2} />);
    // card variant uses h-28 instead of h-16
    expect(container.querySelectorAll(".h-28").length).toBe(2);
  });
});
