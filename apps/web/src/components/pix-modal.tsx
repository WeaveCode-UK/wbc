"use client";

import { useEffect, useState } from "react";
import { Button } from "@wbc/ui";

// F11 follow-up: PIX modal — renders the QR code from the BR Code
// payload and exposes a copy button for the textual "copia e cola"
// version. The qrcode lib is dynamically imported so it ships only
// when this modal opens.

interface PixModalProps {
  code: string | null;
  /** When provided, skip the qrcode lib and use this pre-rendered PNG. */
  qrCodeBase64?: string | null;
  /** Optional caption distinguishing static vs dynamic PIX. */
  caption?: string;
  onClose: () => void;
  onCopied?: () => void;
}

export function PixModal({
  code,
  qrCodeBase64,
  caption,
  onClose,
  onCopied,
}: PixModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setQrDataUrl(null);
      return;
    }
    if (qrCodeBase64) {
      setQrDataUrl(`data:image/png;base64,${qrCodeBase64}`);
      return;
    }
    let cancelled = false;
    void import("qrcode").then((qr) => {
      if (cancelled) return;
      qr.toDataURL(code, { width: 280, margin: 1 })
        .then((url: string) => {
          if (!cancelled) setQrDataUrl(url);
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [code, qrCodeBase64]);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      onCopied?.();
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR Code PIX"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-xl space-y-4 text-center">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          PIX gerado
        </h2>
        <p className="text-body-small text-[var(--color-text-secondary)]">
          {caption ?? "Mande o QR ou cole o código no WhatsApp dela."}
        </p>

        <div className="flex justify-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR Code PIX"
              width={240}
              height={240}
              className="rounded-md border border-[var(--color-border-secondary)]"
            />
          ) : (
            <div className="h-[240px] w-[240px] rounded-md bg-[var(--color-bg-secondary)] animate-pulse" />
          )}
        </div>

        <div className="rounded-md bg-[var(--color-bg-secondary)] p-3">
          <code className="text-caption text-[var(--color-text-primary)] break-all">
            {code}
          </code>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button type="button" onClick={copy}>
            Copiar código
          </Button>
        </div>
      </div>
    </div>
  );
}
