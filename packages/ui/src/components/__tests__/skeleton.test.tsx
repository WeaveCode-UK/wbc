import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton, SkeletonCard, SkeletonListItem } from "../skeleton";

describe("Skeleton component", () => {
  it("renders animate-pulse base class", () => {
    const { container } = render(<Skeleton />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "animate-pulse",
    );
  });

  it("forwards width and height as inline styles", () => {
    const { container } = render(<Skeleton width="80%" height="20px" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe("80%");
    expect(div.style.height).toBe("20px");
  });

  it("appends consumer className", () => {
    const { container } = render(<Skeleton className="extra" />);
    expect((container.firstChild as HTMLElement).className).toContain("extra");
  });
});

describe("SkeletonCard component", () => {
  it("renders three nested Skeletons", () => {
    const { container } = render(<SkeletonCard />);
    // 3 Skeleton blocks inside the card
    expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
  });
});

describe("SkeletonListItem component", () => {
  it("renders an avatar circle + 2 line placeholders", () => {
    const { container } = render(<SkeletonListItem />);
    // 1 round avatar + 2 line skeletons = 3 animate-pulse blocks
    expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
  });
});
