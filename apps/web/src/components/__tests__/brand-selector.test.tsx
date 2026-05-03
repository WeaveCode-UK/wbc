import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// T4.1 — BrandSelector / BUG-09 flicker fix.
// During the loading window the selector must NOT disappear (return null
// causes a flash before brands resolve). It must render an aria-busy
// placeholder. Once data lands the dropdown shows brand B (the persisted
// brand in localStorage), not brand A.

const mockUseQuery = vi.fn();
const mockBrandFilter = {
  activeBrandId: null as string | null,
  setActiveBrandId: vi.fn(),
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: {
      listBrands: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}));

vi.mock("@/providers/brand-filter-provider", () => ({
  useBrandFilter: () => mockBrandFilter,
  BrandFilterProvider: ({ children }: { children: ReactNode }) => children,
}));

import { BrandSelector } from "../brand-selector";

const BRAND_A = { id: "brand-a", name: "Marca A" };
const BRAND_B = { id: "brand-b", name: "Marca B" };

describe("BrandSelector — flicker fix (BUG-09)", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockBrandFilter.activeBrandId = null;
    mockBrandFilter.setActiveBrandId = vi.fn();
  });

  it("renders aria-busy placeholder while loading (no flash to null)", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<BrandSelector />);
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).toBeTruthy();
    expect(busy?.getAttribute("aria-label")).toBe("Carregando marcas");
  });

  it("renders nothing when there are zero brands", () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    const { container } = render(<BrandSelector />);
    expect(container.firstChild).toBeNull();
  });

  it("renders brand name without dropdown when only one brand", () => {
    mockUseQuery.mockReturnValue({ data: [BRAND_A], isLoading: false });
    render(<BrandSelector />);
    expect(screen.getByText("Marca A")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("with persisted brand B in context, only brand B is shown selected — never brand A first", () => {
    mockBrandFilter.activeBrandId = BRAND_B.id;
    mockUseQuery.mockReturnValue({
      data: [BRAND_A, BRAND_B],
      isLoading: false,
    });
    render(<BrandSelector />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    // The selected value must be brand B from the very first render —
    // BUG-08/09 was a flash where activeBrandId initialised to null
    // (= "Todas as marcas") then jumped to the persisted brand.
    expect(select.value).toBe(BRAND_B.id);
  });

  it("changing the select calls setActiveBrandId with the new id", () => {
    mockUseQuery.mockReturnValue({
      data: [BRAND_A, BRAND_B],
      isLoading: false,
    });
    render(<BrandSelector />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: BRAND_B.id } });
    expect(mockBrandFilter.setActiveBrandId).toHaveBeenCalledWith(BRAND_B.id);
  });

  it("selecting empty option resets activeBrandId to null", () => {
    mockBrandFilter.activeBrandId = BRAND_B.id;
    mockUseQuery.mockReturnValue({
      data: [BRAND_A, BRAND_B],
      isLoading: false,
    });
    render(<BrandSelector />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "" } });
    expect(mockBrandFilter.setActiveBrandId).toHaveBeenCalledWith(null);
  });
});
