"use client";

import { useTranslations } from "next-intl";
import { Alert, ToggleSwitch } from "@wbc/ui";
import { useState } from "react";

// F11.E14: post-sale 2+2+2 flow config. The flow itself is wired
// inside the messaging worker; this page is the user-facing toggle.
// Backend persistence of the toggle is queued — for now state stays
// local with a TODO note.

export default function PostSalePage() {
  const t = useTranslations("messaging");
  const [enabled, setEnabled] = useState(true);
  const [delays, setDelays] = useState({ d2: 2, w2: 14, m2: 60 });

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        Pós-venda 2+2+2
      </h1>

      <Alert variant="ia">
        Mensagem 2 dias depois da entrega → 2 semanas → 2 meses, na cadência
        configurada abaixo.
      </Alert>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              Fluxo ativo
            </h2>
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {t("title", { fallback: "Mensagens" })}
            </p>
          </div>
          <ToggleSwitch checked={enabled} onChange={setEnabled} />
        </div>
      </section>

      {enabled && (
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            Cadência (em dias)
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "d2", label: "1ª mensagem" },
                { key: "w2", label: "2ª mensagem" },
                { key: "m2", label: "3ª mensagem" },
              ] as const
            ).map((opt) => (
              <label key={opt.key} className="space-y-1">
                <span className="text-caption text-[var(--color-text-tertiary)]">
                  {opt.label}
                </span>
                <input
                  type="number"
                  min={1}
                  value={delays[opt.key]}
                  onChange={(e) =>
                    setDelays((prev) => ({
                      ...prev,
                      [opt.key]: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 text-body-small text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <Alert variant="warning">
        Persistência da configuração será wirada num próximo épico. Os valores
        acima são apenas para visualização.
      </Alert>
    </div>
  );
}
