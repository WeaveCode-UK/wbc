"use client";

import { Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBrandFilter } from "../providers/brand-filter-provider";

// Topbar control that lets the consultora pin a brand globally.
// Falls back to a "Todas" pseudo-option that clears the filter. Hidden
// while the brand list is empty or has only one entry — there's nothing
// useful to switch between.

export function BrandSelector() {
  const brands = trpc.catalog.listBrands.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { activeBrandId, setActiveBrandId } = useBrandFilter();

  const list = brands.data ?? [];
  if (list.length < 2) return null;

  return (
    <label className="hidden md:inline-flex items-center gap-2 rounded-wc-sm px-2 py-1.5 text-[12px] font-medium text-[var(--wc-fg-3)] hover:bg-[var(--wc-bg-muted)] transition-colors duration-wc-2">
      <Tag className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only">Marca ativa</span>
      <select
        value={activeBrandId ?? ""}
        onChange={(e) => setActiveBrandId(e.target.value || null)}
        className="bg-transparent border-none text-[12px] font-medium text-[var(--wc-fg-2)] focus:outline-none focus:ring-0 cursor-pointer"
      >
        <option value="">Todas as marcas</option>
        {list.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}
