// F11.E07 part C: public self-registration form. The consultora shares
// /cadastro/<tenantSlug> via QR or link; the prospect fills name + phone
// (email optional) and lands as an isLead client in the consultora's
// CRM. The Server Action posts to apps/web's public tRPC handler, so
// landing stays a thin Next page with no DB or business package
// dependency.

const WBC_BASE_URL = process.env.WBC_API_URL ?? "http://localhost:3000";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}

async function selfRegisterAction(formData: FormData): Promise<void> {
  "use server";
  const { redirect } = await import("next/navigation");

  const slug = formData.get("slug")?.toString() ?? "";
  const name = formData.get("name")?.toString() ?? "";
  const phone = formData.get("phone")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";

  if (!name || !phone) {
    redirect(
      `/cadastro/${slug}?err=${encodeURIComponent("Nome e telefone obrigatórios")}`,
    );
  }

  const body = JSON.stringify({
    "0": {
      json: {
        tenantSlug: slug,
        name,
        phone,
        email: email || undefined,
      },
    },
  });

  const response = await fetch(
    `${WBC_BASE_URL}/api/trpc/clients.selfRegister?batch=1`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );

  if (!response.ok) {
    redirect(
      `/cadastro/${slug}?err=${encodeURIComponent("Falha ao cadastrar")}`,
    );
  }
  redirect(`/cadastro/${slug}?ok=1`);
}

export default async function SelfRegistrationPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const success = search?.ok === "1";
  const error = search?.err;

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold">Cadastro recebido!</h1>
          <p className="text-gray-600">
            Sua consultora vai entrar em contato em breve.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <form
        action={selfRegisterAction}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg"
      >
        <input type="hidden" name="slug" value={slug} />
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Cadastre-se</h1>
          <p className="text-sm text-gray-500">
            Receba novidades e ofertas exclusivas
          </p>
        </header>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Nome completo
          </span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">WhatsApp</span>
          <input
            name="phone"
            type="tel"
            required
            placeholder="(11) 99999-9999"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">
            E-mail (opcional)
          </span>
          <input
            name="email"
            type="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          Quero receber novidades
        </button>

        <p className="text-center text-xs text-gray-400">
          Seus dados serão usados apenas para contato pela sua consultora.
        </p>
      </form>
    </main>
  );
}

export const revalidate = 60;
