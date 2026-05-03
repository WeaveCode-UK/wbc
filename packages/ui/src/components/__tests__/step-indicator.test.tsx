import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StepIndicator } from "../step-indicator";

describe("StepIndicator component", () => {
  it("renders one bar per step", () => {
    const { container } = render(<StepIndicator total={3} current={0} />);
    expect(container.querySelectorAll(".rounded-full").length).toBe(3);
  });

  it("paints the active bar wider (w-9) and others narrower (w-6)", () => {
    const { container } = render(<StepIndicator total={4} current={2} />);
    // current bar gets w-9 (1 element); the rest are w-6 (3 elements)
    expect(container.querySelectorAll(".w-9").length).toBe(1);
    expect(container.querySelectorAll(".w-6").length).toBe(3);
  });

  it("paints the active bar with primary background", () => {
    const { container } = render(<StepIndicator total={2} current={1} />);
    const activeBar = Array.from(container.querySelectorAll(".w-9"))[0];
    expect((activeBar as HTMLElement).className).toContain("primary");
  });

  it("appends consumer className", () => {
    const { container } = render(
      <StepIndicator total={2} current={0} className="extra" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain("extra");
  });
});
