import Link from "next/link";

// ACH-002: public privacy policy route. Renders a static PT-BR version
// pointing to the source of truth in docs/PRIVACY_POLICY.md. Next iteration
// should render the markdown directly (MDX) — for now linking preserves
// the single-source-of-truth in the repo.

export const metadata = {
  title: "Política de Privacidade — WBC Platform",
  description:
    "Política de privacidade da WBC Platform (WeaveCode Ltd). LGPD / GDPR.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[var(--wc-bg)] min-h-screen py-12 px-4">
      <article className="mx-auto max-w-[720px] rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-6 sm:p-10 space-y-6 text-[var(--wc-fg-1)]">
        <header>
          <h1 className="text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-[13px] text-[var(--wc-fg-3)]">
            Versão: 0.1.0-draft · Última revisão: 2026-04-23
          </p>
        </header>

        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-muted)] p-4">
          <p className="text-[15px] font-light leading-[1.7] text-[var(--wc-fg-2)]">
            Este é um <strong>placeholder</strong> gerado pela correção da
            auditoria de compliance-privacidade. O conteúdo oficial vive em{" "}
            <Link
              href="https://github.com/WeaveCode-UK/wbc/blob/main/docs/PRIVACY_POLICY.md"
              className="text-[var(--wc-purple)] hover:underline"
            >
              docs/PRIVACY_POLICY.md
            </Link>
            . Após validação jurídica/DPO, esta página renderizará o documento
            completo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[22px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Contato DPO
          </h2>
          <p className="text-[15px] font-light leading-[1.7] text-[var(--wc-fg-2)]">
            <a
              href="mailto:dpo@weavecode.co.uk"
              className="text-[var(--wc-purple)] hover:underline"
            >
              dpo@weavecode.co.uk
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-[22px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Seus direitos (LGPD art. 18-22)
          </h2>
          <ul className="list-disc pl-6 text-[15px] font-light leading-[1.7] text-[var(--wc-fg-2)] space-y-1">
            <li>Acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos ou incorretos.</li>
            <li>Portar seus dados em formato legível.</li>
            <li>Excluir ou anonimizar.</li>
            <li>Revogar consentimento a qualquer momento.</li>
          </ul>
          <p className="text-[12px] text-[var(--wc-fg-3)]">
            Escreva para{" "}
            <a href="mailto:dpo@weavecode.co.uk" className="underline">
              dpo@weavecode.co.uk
            </a>{" "}
            ou use o Centro de Privacidade (em breve).
          </p>
        </section>
      </article>
    </main>
  );
}
