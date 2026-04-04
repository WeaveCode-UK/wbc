'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@wbc/ui/components/button';
import { Input } from '@wbc/ui/components/input';
import { Label } from '@wbc/ui/components/label';
import { useTranslations } from 'next-intl';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/trpc/auth.requestPasswordReset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">{t('resetPassword.sentTitle')}</h1>
        <p className="text-muted-foreground">{t('resetPassword.sentDescription')}</p>
        <Link href="/login">
          <Button variant="outline">{t('resetPassword.backToLogin')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('resetPassword.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('resetPassword.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('login.email')}</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '...' : t('resetPassword.submit')}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          {t('resetPassword.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
