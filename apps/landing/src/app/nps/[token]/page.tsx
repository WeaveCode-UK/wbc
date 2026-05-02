// F11.E10: public NPS form. The DELIVERY_COMPLETED handler creates a
// survey row + token, sends a WhatsApp link to /nps/<token>, and the
// consumer scores 0-10 here. No auth — the token is the trust
// boundary; once responded, the form refuses a second submission.

const WBC_BASE_URL = process.env.WBC_API_URL ?? "http://localhost:3000";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}

async function respondAction(formData: FormData): Promise<void> {
  "use server";
  const { redirect } = await import("next/navigation");
  const token = formData.get("token")?.toString() ?? "";
  const score = Number(formData.get("score") ?? -1);
  const comment = formData.get("comment")?.toString() ?? "";

  if (!token || score < 0 || score > 10) {
    redirect(`/nps/${token}?err=${encodeURIComponent("Nota inválida")}`);
  }

  const body = JSON.stringify({
    "0": {
      json: { token, score, comment: comment || undefined },
    },
  });

  const response = await fetch(
    `${WBC_BASE_URL}/api/trpc/platform.npsRespond?batch=1`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );

  if (!response.ok) {
    redirect(`/nps/${token}?err=${encodeURIComponent("Falha ao enviar")}`);
  }
  redirect(`/nps/${token}?ok=1`);
}

export default async function NpsPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const search = await searchParams;
  const success = search?.ok === "1";
  const error = search?.err;

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <div className="text-5xl">💜</div>
          <h1 className="text-2xl font-bold">Obrigada pelo seu feedback!</h1>
          <p className="text-gray-600">
            Sua opinião nos ajuda a melhorar a cada entrega.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <form
        action={respondAction}
        className="w-full max-w-lg space-y-5 rounded-xl bg-white p-6 shadow-lg"
      >
        <input type="hidden" name="token" value={token} />
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Como foi sua experiência?
          </h1>
          <p className="text-sm text-gray-500">
            De 0 a 10, quanto você nos recomendaria?
          </p>
        </header>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <label
              key={n}
              className="cursor-pointer rounded-md border border-gray-200 py-3 text-center text-sm font-medium text-gray-700 hover:border-purple-500 hover:bg-purple-50 has-[:checked]:bg-purple-600 has-[:checked]:text-white"
            >
              <input
                type="radio"
                name="score"
                value={n}
                required
                className="sr-only"
              />
              {n}
            </label>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Não recomendaria</span>
          <span>Com certeza recomendaria</span>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Comentário (opcional)
          </span>
          <textarea
            name="comment"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}

export const revalidate = 0;
