export default function SchedulePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold text-gray-900">Meu Dia</h2>
          <p className="mt-2 text-sm text-gray-500">Nenhum compromisso para hoje</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold text-gray-900">Lembretes</h2>
          <p className="mt-2 text-sm text-gray-500">Nenhum lembrete pendente</p>
        </div>
      </div>
    </div>
  );
}
