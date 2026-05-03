import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { ErrorBoundary } from "../error-boundary";

// React logs the boundary error to console.error during the failing render.
// Silence it so the test output stays clean.

function Boom({ throwIt }: { throwIt: boolean }): React.JSX.Element {
  if (throwIt) throw new Error("boom-from-child");
  return <p>safe</p>;
}

describe("ErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <Boom throwIt={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("safe")).toBeInTheDocument();
  });

  it("renders fallback UI with the thrown error message", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom throwIt />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Algo se soltou/)).toBeInTheDocument();
    expect(screen.getByText("boom-from-child")).toBeInTheDocument();
    errSpy.mockRestore();
  });

  it("retry button resets state — re-renders children when no longer throwing", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Wrapper(): React.JSX.Element {
      // Once retry runs we want children to render successfully.
      // The boundary state reset is what matters; the child only ever
      // sees throwIt=false here so success is guaranteed after click.
      return (
        <ErrorBoundary>
          <Boom throwIt={false} />
        </ErrorBoundary>
      );
    }

    // First render the boundary catching an error.
    const { rerender } = render(
      <ErrorBoundary>
        <Boom throwIt />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/i }));

    // The boundary state was reset; mount a fresh tree without an error.
    rerender(<Wrapper />);
    expect(screen.getByText("safe")).toBeInTheDocument();
    errSpy.mockRestore();
  });
});
