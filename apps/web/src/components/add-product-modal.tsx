"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

const CATEGORIES = [
  "skincare",
  "makeup",
  "haircare",
  "fragrance",
  "body",
] as const;

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddProductModal({ open, onClose }: AddProductModalProps) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const brands = trpc.catalog.listBrands.useQuery(undefined, { enabled: open });
  const utils = trpc.useUtils();
  const create = trpc.catalog.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Produto criado");
      void utils.catalog.listProducts.invalidate();
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setName("");
    setBrandId("");
    setCategory("");
    setPrice("");
    setCostPrice("");
    setDescription("");
  };

  if (!open) return null;

  const submit = () => {
    const priceNum = Number(price);
    if (!name || !brandId || !priceNum || priceNum <= 0) return;
    const costNum = Number(costPrice);
    create.mutate({
      name,
      brandId,
      price: priceNum,
      costPrice: costNum > 0 ? costNum : undefined,
      description: description || undefined,
      category: category || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("new_product")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wc-blue-800)]/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-wc-xl bg-[var(--wc-bg-elevated)] p-6 shadow-wc-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("new_product")}
          </h2>
          <button
            type="button"
            aria-label={tCommon("close")}
            onClick={onClose}
            className="-m-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--wc-bg-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <Input
          label={t("product_name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />

        <div>
          <label className="block text-caption font-medium text-[var(--color-text-secondary)] mb-1">
            {t("brand")}
          </label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="h-11 w-full rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] px-3 text-[13px] text-[var(--wc-fg-1)]"
            required
          >
            <option value="">{tCommon("select")}</option>
            {(brands.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption font-medium text-[var(--color-text-secondary)] mb-1">
            {t("category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] px-3 text-[13px] text-[var(--wc-fg-1)]"
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`category_${c}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("price")}
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Input
            label={t("cost_price")}
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-caption font-medium text-[var(--color-text-secondary)] mb-1">
            {t("description_label")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 text-[13px] text-[var(--wc-fg-1)] focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)]"
          />
        </div>

        {create.error && <Alert variant="danger">{create.error.message}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={submit}
            loading={create.isPending}
            disabled={create.isPending || !name || !brandId || !price}
          >
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
