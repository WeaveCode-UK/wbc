import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SegmentedControl } from "../segmented-control";

const OPTIONS = [
  { value: "a", label: "Aba A" },
  { value: "b", label: "Aba B" },
  { value: "c", label: "Aba C" },
];

describe("SegmentedControl component", () => {
  it("renders one tab per option", () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="a"
        onChange={() => undefined}
      />,
    );
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("marks the active option with aria-selected=true", () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="b"
        onChange={() => undefined}
      />,
    );
    const tabB = screen.getByRole("tab", { name: "Aba B" });
    expect(tabB).toHaveAttribute("aria-selected", "true");
    const tabA = screen.getByRole("tab", { name: "Aba A" });
    expect(tabA).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange with new value when a tab is clicked", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl options={OPTIONS} value="a" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Aba C" }));
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("renders inside a tablist", () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="a"
        onChange={() => undefined}
      />,
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
