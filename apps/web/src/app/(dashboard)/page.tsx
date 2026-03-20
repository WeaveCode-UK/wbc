export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-500">Bem-vinda ao WBC Platform</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Vendas do mês</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Faturamento</p>
          <p className="mt-1 text-2xl font-bold">R$ 0,00</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Clientes</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Lembretes</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
