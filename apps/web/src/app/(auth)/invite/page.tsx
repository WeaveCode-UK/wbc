'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@wbc/ui/components/button';
import { Input } from '@wbc/ui/components/input';
import { Label } from '@wbc/ui/components/label';
import { useTranslations } from 'next-intl';

function InviteContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const token = searchParams.get('token');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('invite.invalidTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('invite.invalidDescription')}</p>
      </div>
    );
  }

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/trpc/auth.acceptInvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteToken: token, displayName, phone }),
      });
      if (!res.ok) {
        setError(t('invite.error'));
        return;
      }
      await update({});
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError(t('invite.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('invite.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('invite.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('invite.displayName')}</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} />
        </div>
        <div className="space-y-2">
          <Label>{t('invite.phone')}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={10} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleAccept} disabled={loading || !displayName || !phone}>
          {loading ? '...' : t('invite.accept')}
        </Button>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteContent />
    </Suspense>
  );
}
