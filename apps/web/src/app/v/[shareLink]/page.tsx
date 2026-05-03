"use client";

import { useParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
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
      <main className="min-h-screen flex items-center justify-center bg-[var(--wc-bg)] p-6">
        <p className="text-[13px] text-[var(--wc-fg-3)]">Carregando vitrine…</p>
      </main>
    );
  }

  if (!showcase.data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--wc-bg)] p-6">
        <div className="max-w-md w-full rounded-wc-lg bg-white p-8 shadow-wc-md text-center space-y-3">
          <h1 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Vitrine indisponível
          </h1>
          <p className="text-[13px] text-[var(--wc-fg-3)]">
            Este link não existe mais ou foi desativado pela consultora.
          </p>
        </div>
      </main>
    );
  }

  const data = showcase.data;

  return (
    <main className="min-h-screen bg-[var(--wc-bg)] pb-12">
      <header className="bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot px-4 py-10 sm:px-6 sm:py-14 text-white">
        <div className="mx-auto max-w-4xl space-y-2">
          <p className="text-[12px] uppercase tracking-wider opacity-80">
            Curado por {data.consultora}
          </p>
          <h1 className="text-[32px] sm:text-[44px] font-semibold tracking-tight">
            {data.name.split(" ").length > 1 ? (
              <>
                {data.name.split(" ").slice(0, -1).join(" ")}{" "}
                <em className="font-serif italic font-normal text-[var(--wc-orange)]">
                  {data.name.split(" ").slice(-1)[0]}
                </em>
              </>
            ) : (
              data.name
            )}
          </h1>
          <p className="text-[13px] opacity-90">
            {data.products.length} produto
            {data.products.length === 1 ? "" : "s"} selecionado
            {data.products.length === 1 ? "" : "s"} pra você
          </p>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-4xl px-4 sm:px-6">
        {data.products.length === 0 ? (
          <p className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-6 text-center text-[13px] text-[var(--wc-fg-3)]">
            Esta vitrine ainda não tem produtos.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map((p) => (
              <li
                key={p.id}
                className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs hover:shadow-wc-md transition-shadow overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[var(--wc-bg-muted)] flex items-center justify-center">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag
                      aria-hidden="true"
                      className="h-8 w-8 text-[var(--wc-fg-3)]"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className="p-4 space-y-1 flex-1 flex flex-col">
                  {p.brand && (
                    <p className="text-[12px] uppercase tracking-wider text-[var(--wc-fg-3)]">
                      {p.brand}
                    </p>
                  )}
                  <h2 className="text-[13px] font-medium text-[var(--wc-fg-1)]">
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="text-[12px] text-[var(--wc-fg-3)] line-clamp-2">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-auto pt-2 text-[15px] font-medium text-[var(--wc-purple)]">
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
            className="inline-flex items-center gap-2 rounded-md bg-[var(--wc-purple)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--wc-purple-700)]"
          >
            Conhecer {data.consultora}
          </a>
        </section>
      )}
    </main>
  );
}
