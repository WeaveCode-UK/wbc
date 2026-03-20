export default function ClientsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Adicionar cliente
        </button>
      </div>
      <div className="mt-6 rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-500">Nenhum cliente cadastrado</p>
        <p className="mt-1 text-sm text-gray-400">Adicione seu primeiro cliente para começar</p>
      </div>
    </div>
  );
}
