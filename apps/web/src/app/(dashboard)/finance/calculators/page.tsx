"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Target } from "lucide-react";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

// Bloco 5 do plano: features #67 (calculadora preço/margem) e #94
// (calculadora meta reversa) já existiam como procedures
// (finance.calculateMargin / finance.calculateGoalReverse) sem UI.
// Esta página expõe ambas em cards lado-a-lado.

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPct(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export default function FinanceCalculatorsPage() {
  const t = useTranslations("finance");

  // Margem
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const margin = trpc.finance.calculateMargin.useQuery(
    {
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
    },
    {
      enabled:
        Number(costPrice) > 0 &&
        Number(salePrice) > 0 &&
        Number(salePrice) > Number(costPrice),
    },
  );

  // Meta reversa
  const [targetIncome, setTargetIncome] = useState("");
  const goal = trpc.finance.calculateGoalReverse.useQuery(
    { targetIncome: Number(targetIncome) },
    { enabled: Number(targetIncome) > 0 },
  );

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/finance"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {t("title")}
      </Link>

      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("calculators_title")}
        </h1>
        <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          {t("calculators_subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator
              className="h-5 w-5 text-[var(--wc-purple)]"
              strokeWidth={1.75}
            />
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("calc_margin_title")}
            </h2>
          </div>
          <p className="text-[12px] text-[var(--wc-fg-3)]">
            {t("calc_margin_help")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("cost_price")}
              type="number"
              step="0.01"
              min="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
            <Input
              label={t("sale_price")}
              type="number"
              step="0.01"
              min="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </div>

          {Number(salePrice) > 0 &&
            Number(costPrice) > 0 &&
            Number(salePrice) <= Number(costPrice) && (
              <Alert variant="warning">{t("calc_margin_negative")}</Alert>
            )}

          {margin.data && (
            <div className="rounded-wc-md bg-[var(--wc-bg-muted)] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[13px] text-[var(--wc-fg-2)]">
                  {t("calc_margin_absolute")}
                </span>
                <span className="text-[15px] font-semibold text-[var(--wc-fg-1)]">
                  {formatBRL(margin.data.margin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-[var(--wc-fg-2)]">
                  {t("calc_margin_percentage")}
                </span>
                <span className="text-[15px] font-semibold text-[var(--wc-purple)]">
                  {formatPct(margin.data.percentage)}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target
              className="h-5 w-5 text-[var(--wc-orange)]"
              strokeWidth={1.75}
            />
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("calc_goal_title")}
            </h2>
          </div>
          <p className="text-[12px] text-[var(--wc-fg-3)]">
            {t("calc_goal_help")}
          </p>

          <Input
            label={t("calc_goal_target")}
            type="number"
            step="0.01"
            min="0.01"
            value={targetIncome}
            onChange={(e) => setTargetIncome(e.target.value)}
          />

          {goal.data && (
            <div className="rounded-wc-md bg-[var(--wc-bg-muted)] p-4">
              <p className="text-[12px] text-[var(--wc-fg-3)]">
                {t("calc_goal_required_sales")}
              </p>
              <p className="text-[24px] font-semibold text-[var(--wc-orange)]">
                {formatBRL(goal.data.requiredSales)}
              </p>
              <p className="mt-2 text-[11px] text-[var(--wc-fg-3)]">
                {t("calc_goal_note")}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
