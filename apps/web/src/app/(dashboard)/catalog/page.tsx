"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, EmptyState, FilterChips, SearchBar } from "@wbc/ui";

const CATEGORY_KEYS = [
  "category_all",
  "category_skincare",
  "category_makeup",
  "category_haircare",
  "category_fragrance",
  "category_body",
] as const;

export default function CatalogPage() {
  const t = useTranslations("catalog");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    "category_all",
  );

  const categoryChips = CATEGORY_KEYS.map((key) => ({
    value: key,
    label: t(key),
  }));

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
            {t("title")}
          </h1>
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {t("subtitle")}
          </p>
        </div>
        <Button type="button" size="sm">
          {t("new_product")}
        </Button>
      </header>

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("search_placeholder")}
      />

      <FilterChips
        chips={categoryChips}
        selected={activeCategory}
        onChange={setActiveCategory}
      />

      <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
        <EmptyState
          icon="🛍️"
          title={t("no_products")}
          description={t("no_products_hint")}
        />
      </div>
    </div>
  );
}
