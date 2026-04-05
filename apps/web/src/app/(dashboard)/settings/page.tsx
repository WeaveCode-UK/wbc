'use client';

import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('platform');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
      <div className="mt-6 space-y-4">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">{t('profile')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('profile_hint')}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">{t('plan')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('plan_hint')}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">{t('landing_page')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('landing_page_hint')}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">{t('export_data')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('export_data_hint')}</p>
        </div>
      </div>
    </div>
  );
}
