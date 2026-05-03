"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11 follow-up: showcase detail/preview. The model has no update
// mutation today (only create + delete on the port), so this page
// focuses on the high-value moves the consultora actually makes:
// copy the public link, preview, delete.

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

  const detail = trpc.catalog.getShowcaseDetail.useQuery(
    { id },
    { enabled: Boolean(id) },
  );
  const utils = trpc.useUtils();
  const remove = trpc.catalog.deleteShowcase.useMutation({
    onSuccess: () => {
      toast.success("Vitrine excluída");
      void utils.catalog.listShowcases.invalidate();
      router.push("/showcases");
    },
    onError: (err) => toast.error(err.message),
  });

  const data = detail.data;

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

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/showcases"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <header className="space-y-1">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {data.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">
            {`${data.products.length} produto${data.products.length === 1 ? "" : "s"}`}
          </Badge>
          {!data.isActive && <Badge variant="warning">inativa</Badge>}
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
      </section>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {data.products.length === 0 ? (
          <EmptyState icon="🛍️" title="Sem produtos" />
        ) : (
          data.products.map((p) => (
            <ListItem
              key={p.id}
              avatar={
                p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-bg-secondary)]">
                    🛍️
                  </span>
                )
              }
              title={p.name}
              subtitle={`${p.brand ?? "—"} · ${formatBRL(p.price)}`}
            />
          ))
        )}
      </section>

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
    </div>
  );
}
