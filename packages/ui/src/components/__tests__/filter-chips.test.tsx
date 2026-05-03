import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FilterChips } from "../filter-chips";

const CHIPS = [
  { value: "vip", label: "VIP", color: "#ff0000", count: 4 },
  { value: "lead", label: "Leads" },
  { value: "active", label: "Ativas" },
];

describe("FilterChips component", () => {
  it("renders one button per chip", () => {
    render(
      <FilterChips chips={CHIPS} selected={null} onChange={() => undefined} />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("renders count next to label when provided", () => {
    render(
      <FilterChips chips={CHIPS} selected={null} onChange={() => undefined} />,
    );
    expect(screen.getByText("VIP")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onChange with the value when an unselected chip is clicked", () => {
    const onChange = vi.fn();
    render(<FilterChips chips={CHIPS} selected={null} onChange={onChange} />);
    fireEvent.click(screen.getByText("Leads"));
    expect(onChange).toHaveBeenCalledWith("lead");
  });

  it("calls onChange with null when the already-selected chip is clicked (toggle off)", () => {
    const onChange = vi.fn();
    render(<FilterChips chips={CHIPS} selected="vip" onChange={onChange} />);
    fireEvent.click(screen.getByText("VIP"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("applies selected styles to the active chip only", () => {
    render(
      <FilterChips chips={CHIPS} selected="vip" onChange={() => undefined} />,
    );
    const vipBtn = screen.getByText("VIP").closest("button");
    expect(vipBtn?.className).toContain("border-[var(--color-primary)]");
    const leadBtn = screen.getByText("Leads").closest("button");
    expect(leadBtn?.className).toContain(
      "border-[var(--color-border-secondary)]",
    );
  });

  it("renders a coloured dot only when chip.color is set", () => {
    const { container } = render(
      <FilterChips chips={CHIPS} selected={null} onChange={() => undefined} />,
    );
    // Only the first chip has a color → exactly one inline-styled dot.
    const dots = Array.from(container.querySelectorAll(".rounded-full")).filter(
      (el) => (el as HTMLElement).style.backgroundColor !== "",
    );
    expect(dots.length).toBe(1);
  });
});
