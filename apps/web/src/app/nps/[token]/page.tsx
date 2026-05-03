"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Button } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

// F11 follow-up: public NPS response page. Backend was already in
// place (platform.npsLookup + npsRespond, both publicProcedure) but
// no UI existed for the consultora's customer to actually answer the
// survey. The page lives outside (auth)/(dashboard) and is added to
// the middleware's publicPaths so the customer can hit it without
// signing in.

const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type Score = (typeof SCORES)[number];

function scoreColor(score: Score): string {
  if (score <= 6) return "var(--wc-error)";
  if (score <= 8) return "var(--wc-warning)";
  return "var(--wc-success)";
}

export default function PublicNpsPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [score, setScore] = useState<Score | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const lookup = trpc.platform.npsLookup.useQuery(
    { token },
    { enabled: Boolean(token) },
  );
  const respond = trpc.platform.npsRespond.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const submit = () => {
    if (score === null) return;
    respond.mutate({
      token,
      score,
      comment: comment.trim() ? comment : undefined,
    });
  };

  if (lookup.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot text-white p-6">
        <p className="text-[13px] opacity-80">Carregando…</p>
      </main>
    );
  }

  if (!lookup.data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot text-white p-6">
        <div className="max-w-md w-full rounded-wc-lg bg-white p-8 shadow-wc-md space-y-3 text-center">
          <h1 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Link inválido
          </h1>
          <p className="text-[13px] text-[var(--wc-fg-3)]">
            Este link de pesquisa não existe ou expirou.
          </p>
        </div>
      </main>
    );
  }

  if (lookup.data.alreadyResponded || submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot text-white p-6">
        <div className="max-w-md w-full rounded-wc-lg bg-white p-8 shadow-wc-md space-y-3 text-center">
          <h1 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Obrigada!
          </h1>
          <p className="text-[13px] text-[var(--wc-fg-3)]">
            Sua resposta foi registrada. Sua opinião é o que nos faz crescer.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--wc-blue-800)] bg-wc-dot-pattern bg-wc-dot text-white p-4 sm:p-6">
      <div className="max-w-lg w-full rounded-wc-lg bg-white p-6 sm:p-8 shadow-wc-md space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Como foi sua{" "}
            <em className="font-serif italic font-normal text-[var(--wc-orange)]">{`{experiência}`}</em>
            ?
          </h1>
          <p className="text-[13px] text-[var(--wc-fg-3)]">
            De 0 a 10, o quanto você recomendaria a sua consultora a uma amiga?
          </p>
        </header>

        <fieldset className="space-y-2" aria-label="Pontuação NPS">
          <legend className="sr-only">Escolha uma pontuação</legend>
          <div className="grid grid-cols-11 gap-1">
            {SCORES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                aria-pressed={score === n}
                aria-label={`Pontuação ${n}`}
                className={`h-12 rounded-md text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wc-purple)] ${
                  score === n
                    ? "text-white"
                    : "bg-[var(--wc-bg-muted)] text-[var(--wc-fg-1)] hover:bg-[var(--wc-border)]"
                }`}
                style={
                  score === n ? { backgroundColor: scoreColor(n) } : undefined
                }
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[12px] text-[var(--wc-fg-3)]">
            <span>Pouco provável</span>
            <span>Muito provável</span>
          </div>
        </fieldset>

        <div className="space-y-1">
          <label
            htmlFor="nps-comment"
            className="block text-[12px] text-[var(--wc-fg-3)]"
          >
            Quer deixar um comentário? (opcional)
          </label>
          <textarea
            id="nps-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-[var(--wc-border)] bg-white p-3 text-[13px] text-[var(--wc-fg-1)] focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)]"
            placeholder="Conte o que mais te marcou…"
          />
        </div>

        {respond.error && (
          <Alert variant="danger">{respond.error.message}</Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={submit}
            loading={respond.isPending}
            disabled={score === null || respond.isPending}
          >
            Enviar
          </Button>
        </div>
      </div>
    </main>
  );
}
