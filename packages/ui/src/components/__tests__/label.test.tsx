import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "../label";

describe("Label component", () => {
  it("renders children", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("forwards htmlFor onto the underlying <label>", () => {
    render(<Label htmlFor="email-input">Email</Label>);
    expect(screen.getByText("Email")).toHaveAttribute("for", "email-input");
  });

  it("appends consumer className alongside base classes", () => {
    render(<Label className="extra">X</Label>);
    expect(screen.getByText("X").className).toContain("extra");
    expect(screen.getByText("X").className).toContain("block");
  });
});
