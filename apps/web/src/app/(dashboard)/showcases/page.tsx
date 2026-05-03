"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, EmptyState, ListItem, ListSkeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11 follow-up: shareable showcase manager. Replaces the gap between
// the existing Showcase model and any UI surface — the consultora
// builds a curated product list per client, copies the share link
// and pastes into WhatsApp.

function publicShowcaseUrl(shareLink: string): string {
  if (typeof window === "undefined") return `/v/${shareLink}`;
  return `${window.location.origin}/v/${shareLink}`;
}

export default function ShowcasesPage() {
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const list = trpc.catalog.listShowcases.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.catalog.deleteShowcase.useMutation({
    onSuccess: () => {
      toast.success("Vitrine excluída");
      void utils.catalog.listShowcases.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const data = list.data ?? [];

  const copyLink = async (shareLink: string) => {
    setBusy(shareLink);
    try {
      await navigator.clipboard.writeText(publicShowcaseUrl(shareLink));
      toast.success(tCommon("copied"));
    } catch {
      toast.error("Falha ao copiar");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          🛍️ Vitrines
        </h1>
        <Link href="/showcases/new">
          <Button type="button" size="sm">
            Nova vitrine
          </Button>
        </Link>
      </div>

      <p className="text-body-small text-[var(--color-text-secondary)]">
        Crie listas de produtos personalizadas e compartilhe o link com cada
        cliente. Sem login do lado dela.
      </p>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={4} />}
        {!list.isLoading && data.length === 0 && (
          <EmptyState
            icon="🛍️"
            title="Nenhuma vitrine ainda"
            description="Crie sua primeira para enviar uma seleção curada por WhatsApp."
            action={
              <Link href="/showcases/new">
                <Button type="button" size="sm">
                  Nova vitrine
                </Button>
              </Link>
            }
          />
        )}
        {!list.isLoading &&
          data.map((s) => (
            <ListItem
              key={s.id}
              title={s.name}
              subtitle={`${s.productCount} produto${s.productCount === 1 ? "" : "s"}${s.clientName ? ` · para ${s.clientName}` : ""}`}
              right={
                <div className="flex flex-wrap items-center gap-1.5">
                  {!s.isActive && <Badge variant="warning">inativa</Badge>}
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => copyLink(s.shareLink)}
                    loading={busy === s.shareLink}
                  >
                    {tCommon("copy")}
                  </Button>
                  <Link href={`/showcases/${s.id}`}>
                    <Button type="button" size="xs" variant="secondary">
                      {tCommon("edit")}
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      if (
                        confirm(
                          `Excluir "${s.name}"? O link público deixa de funcionar.`,
                        )
                      ) {
                        remove.mutate({ id: s.id });
                      }
                    }}
                    disabled={remove.isPending}
                  >
                    {tCommon("delete")}
                  </Button>
                </div>
              }
            />
          ))}
      </section>
    </div>
  );
}
