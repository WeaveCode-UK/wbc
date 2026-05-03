"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

interface AddGiftSuggestorModalProps {
  open: boolean;
  clientId: string;
  onClose: () => void;
}

export function AddGiftSuggestorModal({
  open,
  clientId,
  onClose,
}: AddGiftSuggestorModalProps) {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const utils = trpc.useUtils();
  const add = trpc.clients.addGiftSuggestor.useMutation({
    onSuccess: () => {
      toast.success(t("gift_suggestor_added"));
      void utils.clients.listGiftSuggestors.invalidate({ clientId });
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const [suggestorName, setSuggestorName] = useState("");
  const [suggestorPhone, setSuggestorPhone] = useState("");
  const [touched, setTouched] = useState({ name: false, phone: false });

  const phoneError =
    touched.phone && suggestorPhone && !/^\+\d{10,15}$/.test(suggestorPhone)
      ? t("gift_suggestor_phone_error")
      : undefined;
  const nameError =
    touched.name && !suggestorName
      ? t("gift_suggestor_name_required")
      : undefined;

  const reset = () => {
    setSuggestorName("");
    setSuggestorPhone("");
    setTouched({ name: false, phone: false });
  };

  if (!open) return null;

  const submit = () => {
    if (!suggestorName || !suggestorPhone) return;
    add.mutate({ clientId, suggestorName, suggestorPhone });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("gift_suggestor_add")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wc-blue-800)]/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-wc-xl bg-[var(--wc-bg-elevated)] p-6 shadow-wc-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("gift_suggestor_add")}
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

        <p className="text-[12px] text-[var(--wc-fg-3)]">
          {t("gift_suggestor_help")}
        </p>

        <Input
          label={t("gift_suggestor_name")}
          value={suggestorName}
          onChange={(e) => setSuggestorName(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, name: true }))}
          error={nameError}
          autoFocus
          required
        />
        <Input
          label={t("gift_suggestor_phone")}
          type="tel"
          placeholder="+5511999990000"
          value={suggestorPhone}
          onChange={(e) => setSuggestorPhone(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, phone: true }))}
          error={phoneError}
          required
        />

        {add.error && <Alert variant="danger">{add.error.message}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={submit}
            loading={add.isPending}
            disabled={
              add.isPending ||
              !suggestorName ||
              !suggestorPhone ||
              Boolean(phoneError) ||
              Boolean(nameError)
            }
          >
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
