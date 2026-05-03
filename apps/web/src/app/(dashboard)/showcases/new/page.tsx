"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11 follow-up: showcase creation. Single-page form (kept simple
// because the model is just name + clientId? + productIds[]). Builds
// the product picker on the same screen instead of a multi-step
// wizard so the consultora can see her selection grow as she taps.

export default function NewShowcasePage() {
  const tCommon = useTranslations("common");
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const products = trpc.catalog.listProducts.useQuery({
    search: search || undefined,
  });
  const clients = trpc.clients.list.useQuery({ page: 1, limit: 100 });

  const create = trpc.catalog.createShowcase.useMutation({
    onSuccess: (showcase) => {
      toast.success("Vitrine criada");
      router.push(`/showcases/${showcase.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const productList = products.data ?? [];
  const clientList = clients.data?.data ?? [];
  const canSubmit = name.trim().length > 0 && selected.size > 0;

  const toggle = (productId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    create.mutate({
      name,
      clientId: clientId || undefined,
      productIds: Array.from(selected),
    });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/showcases"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        Nova vitrine
      </h1>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <Input
          label="Nome da vitrine"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Kit pele oleosa pra Ana"
          required
        />

        <div className="space-y-1">
          <label
            htmlFor="showcase-client"
            className="block text-caption text-[var(--color-text-tertiary)]"
          >
            Cliente (opcional)
          </label>
          <select
            id="showcase-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="h-10 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] px-3 text-body-small text-[var(--color-text-primary)]"
          >
            <option value="">Vitrine geral (sem cliente específico)</option>
            {clientList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">
            Produtos
          </h2>
          <Badge variant="info">{`${selected.size} selecionado(s)`}</Badge>
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto…"
        />

        <div className="max-h-[420px] overflow-y-auto">
          {products.isLoading && <ListSkeleton count={6} />}
          {!products.isLoading && productList.length === 0 && (
            <EmptyState icon="🔍" title="Nenhum produto" />
          )}
          {productList.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <ListItem
                key={p.id}
                title={p.name}
                subtitle={`${p.category ?? "—"} · ${new Intl.NumberFormat(
                  "pt-BR",
                  { style: "currency", currency: "BRL" },
                ).format(Number(p.price))}`}
                onClick={() => toggle(p.id)}
                right={
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(p.id)}
                    aria-label={`Selecionar ${p.name}`}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                }
              />
            );
          })}
        </div>
      </section>

      {create.error && <Alert variant="danger">{create.error.message}</Alert>}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={submit}
          loading={create.isPending}
          disabled={!canSubmit || create.isPending}
        >
          Criar vitrine
        </Button>
      </div>
    </div>
  );
}
