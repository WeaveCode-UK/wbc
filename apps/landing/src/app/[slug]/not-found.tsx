// F11.E17: 404 for the public landing page when the slug doesn't
// resolve to an active consultora.

export default function LandingNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-md text-center space-y-3">
        <div className="text-6xl">🌸</div>
        <h1 className="text-2xl font-bold text-gray-900">
          Esta página não existe
        </h1>
        <p className="text-gray-600">
          Verifique o link com sua consultora ou volte para a página inicial.
        </p>
      </div>
    </main>
  );
}
