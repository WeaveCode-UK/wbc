import { useTranslations } from 'next-intl';

export default function SuspendedPage() {
  const t = useTranslations('auth');

  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">{t('suspended.title')}</h1>
      <p className="text-muted-foreground">{t('suspended.description')}</p>
      <p className="text-sm text-muted-foreground">{t('suspended.contact')}</p>
    </div>
  );
}
