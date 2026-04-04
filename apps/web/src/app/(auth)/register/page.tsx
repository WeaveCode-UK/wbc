import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { CredentialsForm } from '@/components/auth/credentials-form';

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('register.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('register.subtitle')}</p>
      </div>

      <GoogleLoginButton />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('login.or')}</span>
        </div>
      </div>

      <CredentialsForm mode="register" />

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t('register.hasAccount')}</span>{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t('register.signIn')}
        </Link>
      </div>
    </>
  );
}
