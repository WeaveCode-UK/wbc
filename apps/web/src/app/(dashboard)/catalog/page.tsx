"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  EmptyState,
  FilterChips,
  ListSkeleton,
  SearchBar,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

const CATEGORY_OPTIONS: Array<{ value: string; key: string }> = [
  { value: "", key: "category_all" },
  { value: "skincare", key: "category_skincare" },
  { value: "makeup", key: "category_makeup" },
  { value: "haircare", key: "category_haircare" },
  { value: "fragrance", key: "category_fragrance" },
  { value: "body", key: "category_body" },
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CatalogPage() {
  const t = useTranslations("catalog");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>("");
  const [brandId, setBrandId] = useState<string | null>(null);

  const products = trpc.catalog.listProducts.useQuery({
    search: search || undefined,
    category: category || undefined,
    brandId: brandId ?? undefined,
  });

  const brands = trpc.catalog.listBrands.useQuery();

  const categoryChips = CATEGORY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.key),
  }));

  const brandChips = (brands.data ?? []).map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const data = products.data ?? [];

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
        onClear={() => setSearch("")}
        placeholder={t("search_placeholder")}
      />

      {brandChips.length > 0 && (
        <FilterChips
          chips={brandChips}
          selected={brandId}
          onChange={setBrandId}
        />
      )}

      <FilterChips
        chips={categoryChips}
        selected={category}
        onChange={setCategory}
      />

      {products.isLoading && <ListSkeleton count={6} variant="card" />}

      {!products.isLoading && data.length === 0 && (
        <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
          <EmptyState
            icon="🛍️"
            title={t("no_products")}
            description={t("no_products_hint")}
          />
        </div>
      )}

      {!products.isLoading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 space-y-2"
            >
              <div className="aspect-square w-full rounded-md bg-[var(--color-bg-secondary)]" />
              <p className="text-body-small font-medium text-[var(--color-text-primary)] truncate">
                {p.name}
              </p>
              {p.category && <Badge variant="neutral">{p.category}</Badge>}
              <p className="text-body-small text-[var(--color-text-primary)]">
                {formatBRL(Number(p.price))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
