"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  FilterChips,
  ListSkeleton,
  SearchBar,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useBrandFilter } from "../../../providers/brand-filter-provider";
import { AddProductModal } from "@/components/add-product-modal";
import { SendProductModal } from "@/components/send-product-modal";
import { Send, Trash2 } from "lucide-react";
import { useToast } from "@/providers/toast-provider";

const CATEGORY_OPTIONS: Array<{ value: string; key: string }> = [
  { value: "", key: "category_all" },
  { value: "skincare", key: "category_skincare" },
  { value: "makeup", key: "category_makeup" },
  { value: "haircare", key: "category_haircare" },
  { value: "fragrance", key: "category_fragrance" },
  { value: "body", key: "category_body" },
];

const CATEGORY_KEYS: Record<string, string> = {
  skincare: "category_skincare",
  makeup: "category_makeup",
  haircare: "category_haircare",
  fragrance: "category_fragrance",
  body: "category_body",
};

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
  const { activeBrandId, setActiveBrandId } = useBrandFilter();
  const [brandId, setBrandId] = useState<string | null>(activeBrandId);
  const [addOpen, setAddOpen] = useState(false);
  const [sendProduct, setSendProduct] = useState<{
    id: string;
    name: string;
    price: number | string;
    description: string | null;
  } | null>(null);
  const toast = useToast();
  const utils = trpc.useUtils();
  // QA BUG-04: card de produto não tinha ação de excluir/editar.
  // Adiciona botão Trash2 que dispara catalog.deleteProduct (com confirm).
  const deleteProduct = trpc.catalog.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success(t("product_deleted"));
      void utils.catalog.listProducts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Topbar selector is the source of truth — sync local state when it
  // changes elsewhere (e.g. switched on /showcases then back here).
  useEffect(() => {
    setBrandId(activeBrandId);
  }, [activeBrandId]);

  const handleBrandChange = (next: string | null) => {
    setBrandId(next);
    setActiveBrandId(next);
  };

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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
            {t("subtitle")}
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          {t("new_product")}
        </Button>
      </header>

      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} />

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
          onChange={handleBrandChange}
        />
      )}

      <FilterChips
        chips={categoryChips}
        selected={category}
        onChange={setCategory}
      />

      {products.isLoading && <ListSkeleton count={6} variant="card" />}

      {!products.isLoading && data.length === 0 && (
        <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs">
          <EmptyState
            icon={
              <ShoppingBag
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
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
              className="rounded-wc-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-3 space-y-2"
            >
              <div className="aspect-square w-full rounded-wc-md bg-[var(--wc-bg-muted)]" />
              <p className="text-[13px] font-medium text-[var(--wc-fg-1)] truncate">
                {p.name}
              </p>
              {p.category && (
                <Badge variant="neutral">
                  {CATEGORY_KEYS[p.category]
                    ? t(CATEGORY_KEYS[p.category])
                    : p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                </Badge>
              )}
              <div className="flex items-center justify-between gap-1">
                <p className="text-[13px] tabular-nums text-[var(--wc-fg-1)]">
                  {formatBRL(Number(p.price))}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    aria-label={t("send_to_client")}
                    onClick={() =>
                      setSendProduct({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        description: p.description ?? null,
                      })
                    }
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    aria-label={t("delete_product")}
                    onClick={() => {
                      if (
                        confirm(t("delete_product_confirm", { name: p.name }))
                      ) {
                        deleteProduct.mutate({ id: p.id });
                      }
                    }}
                    disabled={deleteProduct.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <SendProductModal
            open={sendProduct !== null}
            product={sendProduct}
            onClose={() => setSendProduct(null)}
          />
        </div>
      )}
    </div>
  );
}
