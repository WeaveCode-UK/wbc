"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Item 76 da spec / item 6 do handoff: filtro global por marca para a
// consultora que atende mais de uma marca. Pages que querem listas
// brand-scoped (catálogo, vitrines, ranking) leem `activeBrandId` daqui;
// `null` = "todas as marcas".

interface BrandFilterContextType {
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
}

const BrandFilterContext = createContext<BrandFilterContextType>({
  activeBrandId: null,
  setActiveBrandId: () => undefined,
});

export function useBrandFilter() {
  return useContext(BrandFilterContext);
}

const STORAGE_KEY = "wbc-active-brand-id";

export function BrandFilterProvider({ children }: { children: ReactNode }) {
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setActiveBrandIdState(stored);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const setActiveBrandId = (id: string | null) => {
    setActiveBrandIdState(id);
    try {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no-op */
    }
  };

  return (
    <BrandFilterContext.Provider value={{ activeBrandId, setActiveBrandId }}>
      {children}
    </BrandFilterContext.Provider>
  );
}
