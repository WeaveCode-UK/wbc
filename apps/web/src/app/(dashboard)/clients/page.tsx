'use client';

import { useTranslations } from 'next-intl';

export default function ClientsPage() {
  const t = useTranslations('clients');
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {t('add_client')}
        </button>
      </div>
      <div className="mt-6 rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-500">{t('no_clients')}</p>
        <p className="mt-1 text-sm text-gray-400">{t('no_clients_hint')}</p>
      </div>
    </div>
  );
}
