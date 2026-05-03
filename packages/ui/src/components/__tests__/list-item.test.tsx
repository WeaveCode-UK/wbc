import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ListItem } from "../list-item";

describe("ListItem component", () => {
  it("renders title", () => {
    render(<ListItem title="Maria" />);
    expect(screen.getByText("Maria")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<ListItem title="Maria" subtitle="+5511999990001" />);
    expect(screen.getByText("+5511999990001")).toBeInTheDocument();
  });

  it("renders avatar and right slots", () => {
    render(
      <ListItem
        title="X"
        avatar={<span data-testid="ava">A</span>}
        right={<span data-testid="right">R</span>}
      />,
    );
    expect(screen.getByTestId("ava")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("uses a button wrapper when onClick is provided and fires click", () => {
    const onClick = vi.fn();
    render(<ListItem title="Open" onClick={onClick} />);
    const btn = screen.getByText("Open").closest("button");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn as HTMLButtonElement);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("uses a div wrapper when onClick is omitted", () => {
    render(<ListItem title="Static" />);
    expect(
      screen.getByText("Static").closest("button"),
    ).not.toBeInTheDocument();
  });

  it("applies separator class by default", () => {
    const { container } = render(<ListItem title="X" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "border-b",
    );
  });

  it("removes separator when separator=false", () => {
    const { container } = render(<ListItem title="X" separator={false} />);
    expect((container.firstChild as HTMLElement).className).not.toContain(
      "border-b",
    );
  });
});
