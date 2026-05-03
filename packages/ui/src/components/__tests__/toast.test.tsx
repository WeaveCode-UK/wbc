import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { Toast } from "../toast";

// Coverage lift — Toast auto-dismisses after a duration; we drive the
// timer with vi.useFakeTimers() so each case stays deterministic.

describe("Toast component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when visible=false (and not yet shown)", () => {
    const { container } = render(
      <Toast visible={false} message="hi" onDismiss={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders message and status role when visible", () => {
    render(<Toast visible message="hi" onDismiss={() => undefined} />);
    expect(screen.getByRole("status")).toHaveTextContent("hi");
  });

  it("auto-dismisses after default duration (3000ms for info)", () => {
    const onDismiss = vi.fn();
    render(<Toast visible message="x" onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    // Advance through auto-close window + the 300ms hide animation.
    act(() => {
      vi.advanceTimersByTime(3000 + 300);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("uses 5000ms auto-dismiss for danger variant", () => {
    const onDismiss = vi.fn();
    render(
      <Toast visible variant="danger" message="bad" onDismiss={onDismiss} />,
    );
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000 + 300);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("respects explicit duration override", () => {
    const onDismiss = vi.fn();
    render(<Toast visible message="m" duration={500} onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(500 + 300);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders the variant icon symbol", () => {
    render(
      <Toast
        visible
        variant="success"
        message="ok"
        onDismiss={() => undefined}
      />,
    );
    // success icon is the check char ✓
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("dismiss button calls onDismiss after the 300ms exit animation", () => {
    const onDismiss = vi.fn();
    render(<Toast visible message="m" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onDismiss).toHaveBeenCalled();
  });
});
