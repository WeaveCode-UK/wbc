"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  ListSkeleton,
  ProgressBar,
} from "@wbc/ui";

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[12px] font-medium text-[var(--wc-fg-2)] mb-1"
    >
      {children}
    </label>
  );
}
import { Award } from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(d);
}

export default function CareerGoalsPage() {
  const goals = trpc.team.listCareerGoals.useQuery();
  const create = trpc.team.createCareerGoal.useMutation({
    onSuccess: () => goals.refetch(),
  });
  const deactivate = trpc.team.deactivateCareerGoal.useMutation({
    onSuccess: () => goals.refetch(),
  });

  const [brandName, setBrandName] = useState("");
  const [levelName, setLevelName] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("");
  const [targetByDate, setTargetByDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !levelName || !targetRevenue || !targetByDate) return;
    await create.mutateAsync({
      brandName,
      levelName,
      targetRevenue: Number(targetRevenue),
      targetByDate: new Date(targetByDate),
    });
    setBrandName("");
    setLevelName("");
    setTargetRevenue("");
    setTargetByDate("");
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/settings"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← Configurações
      </Link>

      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Metas de carreira
        </h1>
        <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          Cadastre o nível que quer manter ou conquistar em cada marca. O
          sistema compara o progresso diariamente e te avisa quando faltar
          pouco.
        </p>
      </header>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-4 sm:p-5">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Nova meta
        </h2>
        <form
          onSubmit={handleSubmit}
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div>
            <Label htmlFor="career-brand">Marca</Label>
            <Input
              id="career-brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Mary Kay"
              required
            />
          </div>
          <div>
            <Label htmlFor="career-level">Nível</Label>
            <Input
              id="career-level"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              placeholder="Diretora"
              required
            />
          </div>
          <div>
            <Label htmlFor="career-revenue">Faturamento alvo (R$)</Label>
            <Input
              id="career-revenue"
              type="number"
              min="0"
              step="0.01"
              value={targetRevenue}
              onChange={(e) => setTargetRevenue(e.target.value)}
              placeholder="30000"
              required
            />
          </div>
          <div>
            <Label htmlFor="career-date">Até quando</Label>
            <Input
              id="career-date"
              type="date"
              value={targetByDate}
              onChange={(e) => setTargetByDate(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Salvando…" : "Cadastrar meta"}
            </Button>
            {create.error && (
              <Alert variant="danger" className="mt-3">
                {create.error.message}
              </Alert>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Metas ativas
        </h2>

        {goals.isLoading && <ListSkeleton count={3} variant="card" />}

        {!goals.isLoading && (goals.data ?? []).length === 0 && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs">
            <EmptyState
              icon={
                <Award
                  className="h-5 w-5 text-[var(--wc-purple)]"
                  strokeWidth={1.75}
                />
              }
              title="Nenhuma meta cadastrada"
              description="Cadastre acima a primeira meta da sua carreira."
            />
          </div>
        )}

        {!goals.isLoading &&
          (goals.data ?? []).map((g) => {
            const pct = Math.min(
              100,
              Math.round(
                ((g.targetRevenue - g.progress.remainingRevenue) /
                  g.targetRevenue) *
                  100,
              ),
            );
            return (
              <article
                key={g.id}
                className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-4 space-y-3"
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--wc-fg-1)]">
                      {g.levelName} · {g.brandName}
                    </h3>
                    <p className="text-[12px] text-[var(--wc-fg-3)]">
                      Até {formatDate(g.targetByDate)} ·{" "}
                      {g.progress.daysRemaining} dias restantes
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deactivate.mutate({ id: g.id })}
                  >
                    Encerrar
                  </Button>
                </header>

                <div className="space-y-1">
                  <ProgressBar value={pct} />
                  <div className="flex justify-between text-[12px] text-[var(--wc-fg-3)]">
                    <span>
                      {formatBRL(g.targetRevenue - g.progress.remainingRevenue)}
                    </span>
                    <span>{pct}%</span>
                    <span>{formatBRL(g.targetRevenue)}</span>
                  </div>
                </div>

                {g.progress.isUrgent && (
                  <Alert variant="warning">
                    Faltam {formatBRL(g.progress.remainingRevenue)} em{" "}
                    {g.progress.daysRemaining} dias — prioridade.
                  </Alert>
                )}
              </article>
            );
          })}
      </section>
    </div>
  );
}
