export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      <div className="mt-6 space-y-4">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Perfil</h2>
          <p className="mt-1 text-sm text-gray-500">Gerencie suas informações pessoais</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Plano</h2>
          <p className="mt-1 text-sm text-gray-500">Gerencie sua assinatura</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Landing Page</h2>
          <p className="mt-1 text-sm text-gray-500">Configure sua página pessoal</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Exportar Dados</h2>
          <p className="mt-1 text-sm text-gray-500">Exporte seus dados em CSV</p>
        </div>
      </div>
    </div>
  );
}
