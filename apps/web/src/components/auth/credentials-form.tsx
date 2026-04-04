'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@wbc/ui/components/button';
import { Input } from '@wbc/ui/components/input';
import { Label } from '@wbc/ui/components/label';
import { useTranslations } from 'next-intl';

interface CredentialsFormProps {
  mode: 'login' | 'register';
}

export function CredentialsForm({ mode }: CredentialsFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError(t('register.passwordMismatch'));
          setLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('login.invalidCredentials'));
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError(t('login.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'register' && (
        <div className="space-y-2">
          <Label htmlFor="name">{t('register.name')}</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('login.email')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('login.password')}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      {mode === 'register' && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '...' : mode === 'login' ? t('login.submit') : t('register.submit')}
      </Button>
    </form>
  );
}
