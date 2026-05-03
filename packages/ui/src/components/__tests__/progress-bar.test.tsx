import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../progress-bar";

describe("ProgressBar component", () => {
  it("renders progressbar role with aria-valuenow", () => {
    render(<ProgressBar value={42} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps value above 100 to 100%", () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("clamps negative values to 0%", () => {
    render(<ProgressBar value={-10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("computes percentage from custom max", () => {
    render(<ProgressBar value={50} max={200} />);
    // 50/200 → 25
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
  });

  it("renders label when showLabel=true", () => {
    render(<ProgressBar value={75} showLabel />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("paints inner bar with the variant colour", () => {
    const { container } = render(<ProgressBar value={50} variant="danger" />);
    const inner = container.querySelector('[role="progressbar"] > div');
    expect((inner as HTMLElement).style.backgroundColor).toContain(
      "--color-danger",
    );
  });
});
