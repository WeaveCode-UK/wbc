// F11.E17: public consultora landing page. Server-rendered with ISR
// (revalidate every 5 minutes). Pulls data via apps/web's public tRPC
// procedure landing.getPublic — apps/landing stays a thin Next page
// without DB or business package dependency.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

const WBC_BASE_URL = process.env.WBC_API_URL ?? "http://localhost:3000";

interface LandingDoc {
  slug: string;
  bio: string | null;
  philosophy: string | null;
  photoUrl: string | null;
  whatsappLink: string | null;
  isActive: boolean;
}

async function fetchLanding(slug: string): Promise<LandingDoc | null> {
  const url = `${WBC_BASE_URL}/api/trpc/landing.getPublic?batch=1&input=${encodeURIComponent(
    JSON.stringify({ "0": { json: { slug } } }),
  )}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const body = (await res.json()) as Array<{
    result?: { data?: { json?: LandingDoc | null } };
  }>;
  return body[0]?.result?.data?.json ?? null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const landing = await fetchLanding(slug);
  if (!landing) {
    return { title: "Página não encontrada — WBC" };
  }
  return {
    title: `${slug} — WBC`,
    description:
      landing.bio ?? "Consultora de beleza no Brasil — WBC Platform.",
    openGraph: {
      title: slug,
      description:
        landing.bio ?? "Consultora de beleza no Brasil — WBC Platform.",
      images: landing.photoUrl ? [landing.photoUrl] : undefined,
    },
  };
}

export default async function ConsultantLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const landing = await fetchLanding(slug);

  if (!landing) {
    notFound();
  }

  const whatsappHref =
    landing.whatsappLink && landing.whatsappLink.startsWith("http")
      ? landing.whatsappLink
      : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="px-6 pt-12 pb-8 text-center">
        <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-purple-200 ring-4 ring-white shadow-lg">
          {landing.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={landing.photoUrl}
              alt={slug}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              💜
            </div>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-gray-900">{slug}</h1>
        {landing.bio && (
          <p className="mt-2 text-base text-gray-600">{landing.bio}</p>
        )}
      </header>

      <section className="mx-auto max-w-md px-6 space-y-6">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-green-500 py-4 text-center text-base font-semibold text-white shadow-md hover:bg-green-600 transition-colors"
          >
            💬 Falar no WhatsApp
          </a>
        )}

        {landing.philosophy && (
          <article className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Sobre mim</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-600 leading-relaxed">
              {landing.philosophy}
            </p>
          </article>
        )}

        <article className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Quer receber novidades?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça seu cadastro rápido e receba ofertas e lançamentos.
          </p>
          <a
            href={`/cadastro/${slug}`}
            className="mt-4 inline-block rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Cadastrar
          </a>
        </article>
      </section>

      <footer className="mt-12 px-6 pb-8 text-center text-xs text-gray-400">
        WBC · Wave Beauty Consultant
      </footer>
    </main>
  );
}

export const revalidate = 300;
