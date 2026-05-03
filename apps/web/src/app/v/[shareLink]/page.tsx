"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";

// F11 follow-up: public showcase page. Customer hits /v/<shareLink>
// directly from a WhatsApp message, sees the curated product list +
// the consultora's name + a "Falar com {consultora}" CTA. No auth.

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function PublicShowcasePage() {
  const params = useParams<{ shareLink: string }>();
  const shareLink = params?.shareLink ?? "";

  const showcase = trpc.catalog.getPublicShowcase.useQuery(
    { shareLink },
    { enabled: Boolean(shareLink) },
  );

  if (showcase.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg-tertiary)] p-6">
        <p className="text-body-small text-[var(--color-text-tertiary)]">
          Carregando vitrine…
        </p>
      </main>
    );
  }

  if (!showcase.data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg-tertiary)] p-6">
        <div className="max-w-md w-full rounded-lg bg-[var(--color-bg-primary)] p-8 shadow-sm text-center space-y-3">
          <h1 className="text-heading-2 text-[var(--color-text-primary)]">
            Vitrine indisponível
          </h1>
          <p className="text-body-small text-[var(--color-text-tertiary)]">
            Este link não existe mais ou foi desativado pela consultora.
          </p>
        </div>
      </main>
    );
  }

  const data = showcase.data;

  return (
    <main className="min-h-screen bg-[var(--color-bg-tertiary)] pb-12">
      <header className="bg-[var(--color-primary)] px-4 py-8 sm:px-6 sm:py-10 text-white">
        <div className="mx-auto max-w-4xl space-y-2">
          <p className="text-caption uppercase tracking-wider opacity-80">
            Curado por {data.consultora}
          </p>
          <h1 className="text-heading-1 sm:text-display-2">{data.name}</h1>
          <p className="text-body-small opacity-90">
            {data.products.length} produto
            {data.products.length === 1 ? "" : "s"} selecionado
            {data.products.length === 1 ? "" : "s"} pra você
          </p>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-4xl px-4 sm:px-6">
        {data.products.length === 0 ? (
          <p className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-6 text-center text-body-small text-[var(--color-text-tertiary)]">
            Esta vitrine ainda não tem produtos.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[var(--color-bg-secondary)] flex items-center justify-center">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden="true" className="text-4xl">
                      🛍️
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-1 flex-1 flex flex-col">
                  {p.brand && (
                    <p className="text-caption uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {p.brand}
                    </p>
                  )}
                  <h2 className="text-body-small font-medium text-[var(--color-text-primary)]">
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="text-caption text-[var(--color-text-tertiary)] line-clamp-2">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-auto pt-2 text-heading-3 text-[var(--color-primary)]">
                    {formatBRL(p.price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.landingSlug && (
        <section className="mx-auto mt-6 max-w-4xl px-4 sm:px-6 text-center">
          <a
            href={`/${data.landingSlug}`}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-body-small font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            Conhecer {data.consultora}
          </a>
        </section>
      )}
    </main>
  );
}
