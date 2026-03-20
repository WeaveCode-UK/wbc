export default function FinancePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Receita</p>
          <p className="mt-1 text-2xl font-bold text-green-600">R$ 0,00</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Despesas</p>
          <p className="mt-1 text-2xl font-bold text-red-600">R$ 0,00</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Lucro</p>
          <p className="mt-1 text-2xl font-bold">R$ 0,00</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">A receber</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">R$ 0,00</p>
        </div>
      </div>
    </div>
  );
}
