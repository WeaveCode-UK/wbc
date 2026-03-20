export default function CampaignsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Nova campanha
        </button>
      </div>
      <div className="mt-6 rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-500">Nenhuma campanha criada</p>
      </div>
    </div>
  );
}
