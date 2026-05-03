"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Button, Input, ListItem, ListSkeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

interface Product {
  id: string;
  name: string;
  price: number | string;
  description: string | null;
}

interface SendProductModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

function formatBRL(value: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

// Bloco 6 do plano: feature #36 — envio de produto individual.
// Lista clientes com busca, escolhe um, abre wa.me com link já
// preenchido (nome + preço + descrição). Reusa messaging.generateLink
// pra pegar o phone server-side (não embute número na URL).

export function SendProductModal({
  open,
  product,
  onClose,
}: SendProductModalProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const clients = trpc.clients.list.useQuery(
    { page: 1, limit: 30, search: search || undefined },
    { enabled: open },
  );

  const utils = trpc.useUtils();

  const handlePick = async (clientId: string) => {
    if (!product) return;
    try {
      const customMessage = `Olha esse produto:\n\n*${product.name}* — ${formatBRL(product.price)}${product.description ? `\n\n${product.description}` : ""}`;
      const result = await utils.messaging.generateLink.fetch({
        clientId,
        kind: "GENERIC",
        customMessage,
      });
      window.open(result.url, "_blank", "noopener,noreferrer");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar link");
    }
  };

  if (!open || !product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("send_product_title")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wc-blue-800)]/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-wc-xl bg-[var(--wc-bg-elevated)] p-6 shadow-wc-xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("send_product_title")}
            </h2>
            <p className="text-[12px] text-[var(--wc-fg-3)]">{product.name}</p>
          </div>
          <button
            type="button"
            aria-label={tCommon("close")}
            onClick={onClose}
            className="-m-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--wc-bg-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <p className="text-[13px] text-[var(--wc-fg-2)]">
          {t("send_product_pick")}
        </p>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--wc-fg-3)]"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tCommon("search")}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {clients.isLoading && <ListSkeleton count={4} />}
          {!clients.isLoading && (clients.data?.data ?? []).length === 0 && (
            <p className="text-[12px] text-[var(--wc-fg-3)] py-4 text-center">
              {tCommon("no_results")}
            </p>
          )}
          {(clients.data?.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c.id)}
              className="w-full text-left rounded-md hover:bg-[var(--wc-bg-muted)] -mx-2 px-2"
            >
              <ListItem title={c.name} subtitle={c.phone} separator />
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
