"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

interface OrderItemDraft {
  productName: string;
  quantity: string;
  unitCost: string;
}

interface AddOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddOrderModal({ open, onClose }: AddOrderModalProps) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const brands = trpc.catalog.listBrands.useQuery(undefined, { enabled: open });
  const utils = trpc.useUtils();
  const create = trpc.inventory.createOrder.useMutation({
    onSuccess: () => {
      toast.success("Pedido criado");
      void utils.inventory.listOrders.invalidate();
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const [brandId, setBrandId] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([
    { productName: "", quantity: "1", unitCost: "" },
  ]);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setBrandId("");
    setItems([{ productName: "", quantity: "1", unitCost: "" }]);
    setNotes("");
  };

  if (!open) return null;

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { productName: "", quantity: "1", unitCost: "" },
    ]);
  const removeItem = (idx: number) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );
  const updateItem = (
    idx: number,
    field: keyof OrderItemDraft,
    value: string,
  ) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );

  const submit = () => {
    if (!brandId) return;
    const parsed = items
      .filter((it) => it.productName && it.quantity && it.unitCost)
      .map((it) => ({
        productName: it.productName,
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
      }));
    if (parsed.length === 0) return;
    create.mutate({
      brandId,
      items: parsed,
      notes: notes || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("new_order")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wc-blue-800)]/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg space-y-4 rounded-wc-xl bg-[var(--wc-bg-elevated)] p-6 shadow-wc-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("new_order")}
        </h2>

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

        <div className="space-y-2">
          <label className="block text-caption font-medium text-[var(--color-text-secondary)]">
            {t("items")}
          </label>
          {items.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-[1fr_4rem_5rem_2rem] gap-2 items-start"
            >
              <Input
                placeholder={t("product_name")}
                value={it.productName}
                onChange={(e) => updateItem(idx, "productName", e.target.value)}
              />
              <Input
                type="number"
                min="1"
                placeholder={t("quantity")}
                value={it.quantity}
                onChange={(e) => updateItem(idx, "quantity", e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder={t("unit_cost")}
                value={it.unitCost}
                onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                aria-label={tCommon("delete")}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addItem}
            icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
          >
            {tCommon("add")}
          </Button>
        </div>

        <Input
          label={t("notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
            disabled={create.isPending || !brandId}
          >
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
