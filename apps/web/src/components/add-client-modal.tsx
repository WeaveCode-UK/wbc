"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11.E20.5: lightweight modal that wraps `clients.create`. The
// previous "Adicionar cliente" button in /clients had no onClick;
// every page that needs the same affordance now mounts this modal
// instead of duplicating the form. Phone validation lives on the
// server (createClientSchema → phoneE164Schema in @wbc/validators).

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function AddClientModal({
  open,
  onClose,
  onCreated,
}: AddClientModalProps) {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLead, setIsLead] = useState(false);

  const utils = trpc.useUtils();
  const create = trpc.clients.create.useMutation({
    onSuccess: (client) => {
      toast.success(`${client.name} criada com sucesso`);
      void utils.clients.list.invalidate();
      setName("");
      setPhone("");
      setEmail("");
      setIsLead(false);
      onCreated?.(client.id);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!open) return null;

  const submit = () => {
    if (!name || !phone) return;
    create.mutate({
      name,
      phone,
      email: email || undefined,
      isLead,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("add_client")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-xl space-y-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("add_client")}
        </h2>

        <div className="space-y-1">
          <label className="text-caption text-[var(--color-text-tertiary)]">
            {t("name")}
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-caption text-[var(--color-text-tertiary)]">
            {t("phone")}
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+5511999990000"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-caption text-[var(--color-text-tertiary)]">
            {t("email")}
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-body-small text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={isLead}
            onChange={(e) => setIsLead(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          {t("leads")}
        </label>

        {create.error && <Alert variant="danger">{create.error.message}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={create.isPending || !name || !phone}
          >
            {create.isPending ? "..." : tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
