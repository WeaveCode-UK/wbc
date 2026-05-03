"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

// F11 follow-up: progressive onboarding widget for the dashboard.
// platform.getUnlockedFeatures was already in the API but had no
// surface beyond per-feature lock badges. This card lives at the top
// of /` and renders three milestone steps with deep-links so a fresh
// consultora can find her next move; once the third milestone clears
// (hasFirstCampaign) the widget hides itself.

interface ChecklistStep {
  done: boolean;
  title: string;
  hint: string;
  href: string;
  cta: string;
}

export function OnboardingChecklist() {
  const state = trpc.platform.getUnlockedFeatures.useQuery();
  const data = state.data;

  if (!data) return null;
  if (data.hasFirstClient && data.hasFirstSale && data.hasFirstCampaign) {
    return null;
  }

  const steps: ChecklistStep[] = [
    {
      done: data.hasFirstClient,
      title: "Cadastre sua primeira cliente",
      hint: "Comece registrando alguém da sua agenda atual.",
      href: "/clients",
      cta: "Ir para Clientes",
    },
    {
      done: data.hasFirstSale,
      title: "Registre sua primeira venda",
      hint: "Mesmo uma venda antiga conta — assim a IA aprende seu mix.",
      href: "/sales/new",
      cta: "Nova venda",
    },
    {
      done: data.hasFirstCampaign,
      title: "Envie sua primeira campanha",
      hint: "Uma mensagem para 3+ clientes destrava o motor de IA.",
      href: "/campaigns/new",
      cta: "Nova campanha",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <section
      aria-label="Checklist de configuração inicial"
      className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-surface)] p-4 sm:p-6 space-y-3"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-heading-3 text-[var(--color-text-primary)]">
          Vamos começar 💜
        </h2>
        <span className="text-caption font-medium text-[var(--color-primary)]">
          {completed}/{steps.length}
        </span>
      </header>

      <div
        className="h-1 w-full rounded-full bg-[var(--color-bg-secondary)] overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="h-full bg-[var(--color-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.title}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  step.done
                    ? "bg-[var(--color-success)] text-white"
                    : "bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]"
                }`}
              >
                {step.done ? "✓" : ""}
              </span>
              <div>
                <p
                  className={`text-body-small font-medium ${
                    step.done
                      ? "text-[var(--color-text-tertiary)] line-through"
                      : "text-[var(--color-text-primary)]"
                  }`}
                >
                  {step.title}
                </p>
                {!step.done && (
                  <p className="text-caption text-[var(--color-text-tertiary)]">
                    {step.hint}
                  </p>
                )}
              </div>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-caption font-medium text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              >
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
