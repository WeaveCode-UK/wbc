"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, EmptyState, ListItem, ListSkeleton, SearchBar } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function WishlistPage() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const toast = useToast();
  const [search, setSearch] = useState("");

  const list = trpc.clients.listWishlist.useQuery(
    { clientId: id },
    { enabled: !!id },
  );
  // F11.E20.5: live product picker. Disabled until the user types
  // something so the page doesn't list every product on first paint.
  const products = trpc.catalog.listProducts.useQuery(
    { search: search || undefined },
    { enabled: search.trim().length > 0 },
  );

  const utils = trpc.useUtils();
  const add = trpc.clients.addToWishlist.useMutation({
    onSuccess: () => {
      setSearch("");
      void utils.clients.listWishlist.invalidate({ clientId: id });
      toast.success(t("profile_wishlist_add"));
    },
    onError: (err) => toast.error(err.message),
  });
  const remove = trpc.clients.removeFromWishlist.useMutation({
    onSuccess: () => {
      void utils.clients.listWishlist.invalidate({ clientId: id });
      toast.success(tCommon("delete"));
    },
    onError: (err) => toast.error(err.message),
  });

  const items = list.data ?? [];
  const productsHits = products.data ?? [];
  const existingProductIds = new Set(items.map((i) => i.productId));

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href={`/clients/${id}`}
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {t("profile_back")}
      </Link>

      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        🎁 {t("wishlist")}
      </h1>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder={t("profile_wishlist_add")}
        />
        {search.trim().length > 0 && (
          <div className="max-h-72 overflow-y-auto rounded-md bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-tertiary)]">
            {products.isLoading && <ListSkeleton count={3} />}
            {!products.isLoading && productsHits.length === 0 && (
              <p className="p-3 text-caption text-[var(--color-text-tertiary)]">
                {tCommon("no_results")}
              </p>
            )}
            {productsHits.map((p) => {
              const already = existingProductIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    !already && add.mutate({ clientId: id, productId: p.id })
                  }
                  disabled={already || add.isPending}
                  className="block w-full text-left px-3 py-2 hover:bg-[var(--color-bg-primary)] disabled:opacity-50"
                >
                  <span className="text-body-small text-[var(--color-text-primary)]">
                    {p.name}
                  </span>
                  <span className="ml-2 text-caption text-[var(--color-text-tertiary)]">
                    {formatBRL(Number(p.price))}
                  </span>
                  {already && (
                    <span className="ml-2 text-caption text-[var(--color-success-text)]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={3} />}
        {!list.isLoading && items.length === 0 && (
          <EmptyState icon="🎁" title={t("profile_wishlist_empty")} />
        )}
        {items.map((item) => (
          <ListItem
            key={item.id}
            title={item.productName}
            subtitle={formatBRL(item.productPrice)}
            right={
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={tCommon("delete")}
                onClick={() =>
                  remove.mutate({
                    clientId: id,
                    productId: item.productId,
                  })
                }
              >
                ×
              </Button>
            }
          />
        ))}
      </section>
    </div>
  );
}
