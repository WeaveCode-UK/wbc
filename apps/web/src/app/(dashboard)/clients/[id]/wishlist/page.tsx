"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

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
  const [productId, setProductId] = useState("");

  const list = trpc.clients.listWishlist.useQuery(
    { clientId: id },
    { enabled: !!id },
  );
  const utils = trpc.useUtils();
  const add = trpc.clients.addToWishlist.useMutation({
    onSuccess: () => {
      setProductId("");
      void utils.clients.listWishlist.invalidate({ clientId: id });
    },
  });
  const remove = trpc.clients.removeFromWishlist.useMutation({
    onSuccess: () =>
      void utils.clients.listWishlist.invalidate({ clientId: id }),
  });

  const items = list.data ?? [];

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
        <div className="flex gap-2">
          <Input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="ID do produto (UUID)"
          />
          <Button
            type="button"
            onClick={() => productId && add.mutate({ clientId: id, productId })}
            disabled={add.isPending || !productId}
          >
            {tCommon("create")}
          </Button>
        </div>
        {add.error && <Alert variant="danger">{add.error.message}</Alert>}
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
