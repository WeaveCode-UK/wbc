"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
  ToggleSwitch,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11 follow-up: editable showcase detail. Combines preview, copy
// link, edit (rename + toggle active + reorder/swap products) and
// delete. Persists via catalog.updateShowcase (full-replace product
// set in a transaction).

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function publicShowcaseUrl(shareLink: string): string {
  if (typeof window === "undefined") return `/v/${shareLink}`;
  return `${window.location.origin}/v/${shareLink}`;
}

export default function ShowcaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tCommon = useTranslations("common");
  const toast = useToast();
  const id = params?.id ?? "";
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const detail = trpc.catalog.getShowcaseDetail.useQuery(
    { id },
    { enabled: Boolean(id) },
  );
  const products = trpc.catalog.listProducts.useQuery(
    { search: search || undefined },
    { enabled: editing },
  );
  const utils = trpc.useUtils();

  // Hydrate edit-mode state when the query resolves or we toggle into
  // edit mode for the first time.
  useEffect(() => {
    if (!detail.data) return;
    setName(detail.data.name);
    setIsActive(detail.data.isActive);
    setSelected(detail.data.products.map((p) => p.id));
  }, [detail.data]);

  const update = trpc.catalog.updateShowcase.useMutation({
    onSuccess: () => {
      toast.success("Vitrine atualizada");
      void utils.catalog.getShowcaseDetail.invalidate({ id });
      void utils.catalog.listShowcases.invalidate();
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const remove = trpc.catalog.deleteShowcase.useMutation({
    onSuccess: () => {
      toast.success("Vitrine excluída");
      void utils.catalog.listShowcases.invalidate();
      router.push("/showcases");
    },
    onError: (err) => toast.error(err.message),
  });

  const data = detail.data;
  const productList = products.data ?? [];

  const isDirty = useMemo(() => {
    if (!data) return false;
    if (data.name !== name) return true;
    if (data.isActive !== isActive) return true;
    const original = data.products.map((p) => p.id).join(",");
    const current = selected.join(",");
    return original !== current;
  }, [data, name, isActive, selected]);

  const toggle = (productId: string) => {
    setSelected((prev) =>
      prev.includes(productId)
        ? prev.filter((p) => p !== productId)
        : [...prev, productId],
    );
  };
  const move = (idx: number, delta: -1 | 1) => {
    setSelected((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  };

  const copyLink = async () => {
    if (!data) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(publicShowcaseUrl(data.shareLink));
      toast.success(tCommon("copied"));
    } catch {
      toast.error("Falha ao copiar");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!data) return;
    update.mutate({
      id,
      name: data.name === name ? undefined : name,
      isActive: data.isActive === isActive ? undefined : isActive,
      productIds: selected,
    });
  };

  if (detail.isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        <ListSkeleton count={4} variant="card" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-3 sm:p-6 space-y-4">
        <Link
          href="/showcases"
          className="text-body-small text-[var(--color-primary)] hover:underline"
        >
          ← {tCommon("back")}
        </Link>
        <Alert variant="warning">Vitrine não encontrada.</Alert>
      </div>
    );
  }

  // Selected products with their full data, normalised to a single
  // shape regardless of whether the row came from the showcase
  // detail (has `brand` string) or the catalog list (no `brand` —
  // we fall back to category). The consultora sees her chosen order
  // in real time even after adding new products in edit mode.
  interface ProductView {
    id: string;
    name: string;
    price: number;
    brand: string | null;
  }
  const productById = new Map<string, ProductView>();
  for (const p of data.products) {
    productById.set(p.id, {
      id: p.id,
      name: p.name,
      price: p.price,
      brand: p.brand ?? null,
    });
  }
  for (const p of productList) {
    if (productById.has(p.id)) continue;
    productById.set(p.id, {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      brand: p.category ?? null,
    });
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/showcases"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 flex-1">
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Nome da vitrine"
            />
          ) : (
            <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
              {data.name}
            </h1>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">
              {`${selected.length} produto${selected.length === 1 ? "" : "s"}`}
            </Badge>
            {!isActive && <Badge variant="warning">inativa</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setEditing(true)}
            >
              {tCommon("edit")}
            </Button>
          )}
          {editing && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setName(data.name);
                  setIsActive(data.isActive);
                  setSelected(data.products.map((p) => p.id));
                }}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={save}
                loading={update.isPending}
                disabled={!isDirty || update.isPending}
              >
                {tCommon("save")}
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-caption text-[var(--color-text-tertiary)]">
              Link público
            </p>
            <code className="text-body-small text-[var(--color-text-primary)] break-all">
              {publicShowcaseUrl(data.shareLink)}
            </code>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={copyLink}
              loading={busy}
            >
              {tCommon("copy")}
            </Button>
            <Link
              href={publicShowcaseUrl(data.shareLink)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" size="sm">
                Abrir prévia
              </Button>
            </Link>
          </div>
        </div>
        {editing && (
          <div className="flex items-center justify-between border-t border-[var(--color-border-tertiary)] pt-3">
            <div>
              <p className="text-body-small text-[var(--color-text-primary)]">
                Vitrine ativa
              </p>
              <p className="text-caption text-[var(--color-text-tertiary)]">
                Quando inativa, o link público responde 404.
              </p>
            </div>
            <ToggleSwitch checked={isActive} onChange={setIsActive} />
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4 space-y-2">
        <h2 className="text-heading-3 px-2 text-[var(--color-text-primary)]">
          Produtos
        </h2>
        {selected.length === 0 ? (
          <EmptyState icon="🛍️" title="Sem produtos" />
        ) : (
          selected.map((productId, idx) => {
            const p = productById.get(productId);
            if (!p) return null;
            return (
              <ListItem
                key={productId}
                title={p.name}
                subtitle={`${p.brand ?? "—"} · ${formatBRL(p.price)}`}
                right={
                  editing ? (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Mover para cima"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => move(idx, 1)}
                        disabled={idx === selected.length - 1}
                        aria-label="Mover para baixo"
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => toggle(productId)}
                        aria-label="Remover produto"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : null
                }
              />
            );
          })
        )}
      </section>

      {editing && (
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">
            Adicionar produtos
          </h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…"
          />
          <div className="max-h-[420px] overflow-y-auto">
            {products.isLoading && <ListSkeleton count={4} />}
            {!products.isLoading &&
              productList
                .filter((p) => !selected.includes(p.id))
                .map((p) => (
                  <ListItem
                    key={p.id}
                    title={p.name}
                    subtitle={`${p.category ?? "—"} · ${formatBRL(Number(p.price))}`}
                    onClick={() => toggle(p.id)}
                    right={
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(p.id);
                        }}
                      >
                        +
                      </Button>
                    }
                  />
                ))}
          </div>
        </section>
      )}

      {!editing && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (
                confirm(
                  `Excluir "${data.name}"? O link público deixa de funcionar.`,
                )
              ) {
                remove.mutate({ id });
              }
            }}
            loading={remove.isPending}
          >
            Excluir vitrine
          </Button>
        </div>
      )}
    </div>
  );
}
