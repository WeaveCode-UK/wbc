"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
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
  const router = useRouter();
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
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Vitrines
        </h1>
        <Button
          type="button"
          size="sm"
          onClick={() => router.push("/showcases/new")}
        >
          Nova vitrine
        </Button>
      </div>

      <p className="text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
        Crie listas de produtos personalizadas e compartilhe o link com cada
        cliente. Sem login do lado dela.
      </p>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={4} />}
        {!list.isLoading && data.length === 0 && (
          <EmptyState
            icon={
              <ShoppingBag
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
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
