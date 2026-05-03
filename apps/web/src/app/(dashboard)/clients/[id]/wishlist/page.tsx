"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, EmptyState, ListItem, ListSkeleton, SearchBar } from "@wbc/ui";
import { Check, Gift } from "lucide-react";
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
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {t("profile_back")}
      </Link>

      <h1 className="flex items-center gap-2 text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        <Gift className="h-6 w-6 text-[var(--wc-purple)]" strokeWidth={1.75} />
        {t("wishlist")}
      </h1>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder={t("profile_wishlist_add")}
        />
        {search.trim().length > 0 && (
          <div className="max-h-72 overflow-y-auto rounded-md bg-[var(--wc-bg-muted)] divide-y divide-[var(--wc-border)]">
            {products.isLoading && <ListSkeleton count={3} />}
            {!products.isLoading && productsHits.length === 0 && (
              <p className="p-3 text-[11px] text-[var(--wc-fg-3)]">
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
                  className="block w-full text-left px-3 py-2 hover:bg-[var(--wc-bg-elevated)] disabled:opacity-50"
                >
                  <span className="text-[13px] text-[var(--wc-fg-1)]">
                    {p.name}
                  </span>
                  <span className="ml-2 text-[11px] text-[var(--wc-fg-3)]">
                    {formatBRL(Number(p.price))}
                  </span>
                  {already && (
                    <span className="ml-2 inline-flex text-[var(--wc-success)]">
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] overflow-hidden p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={3} />}
        {!list.isLoading && items.length === 0 && (
          <EmptyState
            icon={
              <Gift
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={t("profile_wishlist_empty")}
          />
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
