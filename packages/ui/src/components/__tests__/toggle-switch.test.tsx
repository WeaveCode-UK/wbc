import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToggleSwitch } from "../toggle-switch";

describe("ToggleSwitch component", () => {
  it("renders with role=switch and reflects checked state", () => {
    render(<ToggleSwitch checked={true} onChange={() => undefined} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("renders aria-checked=false when off", () => {
    render(<ToggleSwitch checked={false} onChange={() => undefined} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("renders label text when provided", () => {
    render(
      <ToggleSwitch checked={false} onChange={() => undefined} label="Notif" />,
    );
    expect(screen.getByText("Notif")).toBeInTheDocument();
  });

  it("calls onChange with toggled value when clicked", () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not call onChange when disabled and clicked", () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("button gets disabled HTML attribute when disabled", () => {
    render(
      <ToggleSwitch checked={false} onChange={() => undefined} disabled />,
    );
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
