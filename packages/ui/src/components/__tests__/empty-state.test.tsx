import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../empty-state";

describe("EmptyState component", () => {
  it("renders title", () => {
    render(<EmptyState title="Sem itens" />);
    expect(
      screen.getByRole("heading", { name: "Sem itens" }),
    ).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="X" description="Adicione algo" />);
    expect(screen.getByText("Adicione algo")).toBeInTheDocument();
  });

  it("renders action node", () => {
    render(<EmptyState title="X" action={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("renders icon node when provided", () => {
    render(<EmptyState title="X" icon={<span data-testid="icon">I</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("omits icon container when icon is undefined", () => {
    const { container } = render(<EmptyState title="X" />);
    // icon wrapper has h-12 w-12 — when missing, no such div is rendered
    expect(container.querySelectorAll(".h-12.w-12").length).toBe(0);
  });
});
