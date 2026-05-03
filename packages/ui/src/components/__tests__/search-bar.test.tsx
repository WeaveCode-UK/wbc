import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { SearchBar } from "../search-bar";

describe("SearchBar component", () => {
  it("renders an input with role=searchbox + default aria-label", () => {
    render(<SearchBar value="" onChange={() => undefined} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("aria-label", "Search");
  });

  it("respects user-provided aria-label", () => {
    render(
      <SearchBar value="" onChange={() => undefined} aria-label="Buscar" />,
    );
    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "aria-label",
      "Buscar",
    );
  });

  it("calls onChange when user types", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "abc" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("does not render clear button when value is empty", () => {
    render(<SearchBar value="" onClear={() => undefined} />);
    expect(
      screen.queryByRole("button", { name: /Clear search/i }),
    ).not.toBeInTheDocument();
  });

  it("renders clear button only when value AND onClear are present", () => {
    const onClear = vi.fn();
    render(<SearchBar value="abc" onClear={onClear} />);
    const clear = screen.getByRole("button", { name: /Clear search/i });
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("forwards ref to underlying input", () => {
    function Probe() {
      const ref = useRef<HTMLInputElement>(null);
      return (
        <>
          <SearchBar ref={ref} value="" />
          <button onClick={() => ref.current?.focus()}>focus</button>
        </>
      );
    }
    render(<Probe />);
    fireEvent.click(screen.getByText("focus"));
    expect(document.activeElement).toBe(screen.getByRole("searchbox"));
  });
});
