'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setStep('code');
      } else {
        setError('Falha ao enviar código');
      }
    } catch {
      setError('Falha ao enviar código');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      await signIn('otp', {
        phone,
        code,
        redirect: true,
        callbackUrl: '/',
      });
    } catch {
      setError('Código inválido ou expirado');
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-tertiary)]">
      <div className="w-full max-w-sm space-y-6 rounded-lg bg-[var(--color-bg-primary)] p-8 border border-[var(--color-border-secondary)]">
        <div className="text-center">
          <div className="mb-4 text-3xl font-medium text-[var(--color-primary)]" style={{ fontFamily: 'Azonix, Sora, sans-serif' }}>
            WBC
          </div>
          <h1 className="text-heading-1 text-[var(--color-text-primary)]">Entrar</h1>
          <p className="mt-1 text-body-small text-[var(--color-text-tertiary)]">
            Insira seu telefone para receber o código
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-[var(--color-danger-bg)] p-3 text-body-small text-[var(--color-danger-text)]">{error}</div>
        )}

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-caption text-[var(--color-text-tertiary)] mb-1">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+5511999999999"
                className="h-10 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] px-3 text-body-small text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || !phone}
              className="w-full h-10 rounded-md bg-[var(--color-primary)] px-4 text-body-small font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando...
                </span>
              ) : 'Enviar código'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-caption text-[var(--color-text-tertiary)] mb-1">
                Código de verificação
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="h-10 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] px-3 text-center text-heading-2 tracking-[0.3em] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full h-10 rounded-md bg-[var(--color-primary)] px-4 text-body-small font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verificando...
                </span>
              ) : 'Verificar'}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="w-full text-body-small text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Voltar
            </button>
          </div>
        )}

        <p className="text-center text-body-small text-[var(--color-text-tertiary)]">
          Não tem conta?{' '}
          <Link href="/register" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
