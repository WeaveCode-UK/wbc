import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ActionSheet } from "../action-sheet";

describe("ActionSheet component", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(
      <ActionSheet open={false} onClose={() => undefined} items={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog with role=dialog when open", () => {
    render(
      <ActionSheet
        open
        onClose={() => undefined}
        items={[{ label: "A", onClick: () => undefined }]}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders one button per item, plus close on click", () => {
    const a = vi.fn();
    const b = vi.fn();
    render(
      <ActionSheet
        open
        onClose={() => undefined}
        items={[
          { label: "Aaaa", onClick: a },
          { label: "Bbbb", onClick: b },
        ]}
      />,
    );
    expect(screen.getByText("Aaaa")).toBeInTheDocument();
    expect(screen.getByText("Bbbb")).toBeInTheDocument();
  });

  it("clicking an item fires its onClick AND onClose (sheet auto-dismisses)", () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    render(
      <ActionSheet
        open
        onClose={onClose}
        items={[{ label: "Action", onClick }]}
      />,
    );
    fireEvent.click(screen.getByText("Action"));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("clicking the backdrop calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ActionSheet
        open
        onClose={onClose}
        items={[{ label: "X", onClick: () => undefined }]}
      />,
    );
    const backdrop = container.querySelector("[aria-hidden]") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("destructive items get danger text colour", () => {
    render(
      <ActionSheet
        open
        onClose={() => undefined}
        items={[
          { label: "Delete", onClick: () => undefined, destructive: true },
        ]}
      />,
    );
    const btn = screen.getByText("Delete").closest("button");
    expect(btn?.className).toContain("color-danger");
  });
});
