"use client";

import { Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBrandFilter } from "../providers/brand-filter-provider";

// Topbar control que pinna uma marca globalmente.
// QA BUG-09: o controle "desaparecia" em /schedule e /landing porque
// `if (list.length < 2) return null;` retornava null durante a janela
// de loading inicial em rotas que disparam outras tRPC queries em
// paralelo (race causando re-render do Suspense boundary). Mantemos
// o slot visível com um placeholder enquanto carrega — sem flicker.
// Também sempre mostramos quando há ao menos 1 marca (sem dropdown
// se for 1 só, mas com o nome visível, dando contexto à consultora).

export function BrandSelector() {
  const brands = trpc.catalog.listBrands.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000, // 5min — marcas mudam pouco; reduz refetch entre rotas
  });
  const { activeBrandId, setActiveBrandId } = useBrandFilter();

  const list = brands.data ?? [];

  if (brands.isLoading) {
    return (
      <span
        aria-busy="true"
        aria-label="Carregando marcas"
        className="hidden md:inline-flex items-center gap-2 rounded-wc-sm px-2 py-1.5 text-[12px] font-medium text-[var(--wc-fg-3)]"
      >
        <Tag
          className="h-4 w-4 animate-pulse"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className="h-3 w-24 rounded bg-[var(--wc-bg-muted)] animate-pulse" />
      </span>
    );
  }

  if (list.length === 0) return null;

  if (list.length === 1 && list[0]) {
    return (
      <span className="hidden md:inline-flex items-center gap-2 rounded-wc-sm px-2 py-1.5 text-[12px] font-medium text-[var(--wc-fg-3)]">
        <Tag className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        {list[0].name}
      </span>
    );
  }

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
