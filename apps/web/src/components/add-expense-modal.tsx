"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ open, onClose }: AddExpenseModalProps) {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const utils = trpc.useUtils();
  const create = trpc.finance.createExpense.useMutation({
    onSuccess: () => {
      toast.success("Despesa registrada");
      void utils.finance.getDashboard.invalidate();
      void utils.finance.listExpenses.invalidate();
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const today = new Date().toISOString().slice(0, 10);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("operacional");
  const [date, setDate] = useState(today);

  const reset = () => {
    setDescription("");
    setAmount("");
    setCategory("operacional");
    setDate(today);
  };

  if (!open) return null;

  const submit = () => {
    const amountNum = Number(amount);
    if (!description || !amountNum || amountNum <= 0) return;
    create.mutate({
      description,
      amount: amountNum,
      category: category || undefined,
      date: new Date(date),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("new_expense")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wc-blue-800)]/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-wc-xl bg-[var(--wc-bg-elevated)] p-6 shadow-wc-xl">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("new_expense")}
        </h2>

        <Input
          label={t("description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoFocus
          required
        />

        <Input
          label={t("amount")}
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div>
          <label className="block text-caption font-medium text-[var(--color-text-secondary)] mb-1">
            {t("category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] px-3 text-[13px] text-[var(--wc-fg-1)]"
          >
            <option value="operacional">{t("category_operational")}</option>
            <option value="marketing">{t("category_marketing")}</option>
            <option value="logistica">{t("category_logistics")}</option>
            <option value="outro">{t("category_other")}</option>
          </select>
        </div>

        <Input
          label={t("date")}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {create.error && <Alert variant="danger">{create.error.message}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={submit}
            loading={create.isPending}
            disabled={create.isPending || !description || !amount}
          >
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
