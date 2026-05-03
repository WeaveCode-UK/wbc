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
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    email: false,
  });

  // F11.E28: inline validation. Phone must be E.164 (+countryNumber);
  // email is best-effort. Errors only show after the field has been
  // blurred to avoid yelling at the user mid-typing.
  const phoneError =
    touched.phone && phone && !/^\+\d{10,15}$/.test(phone)
      ? "Use formato internacional, ex: +5511999990000"
      : undefined;
  const emailError =
    touched.email && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "E-mail inválido"
      : undefined;
  const nameError = touched.name && !name ? "Nome obrigatório" : undefined;
  const hasErrors = Boolean(phoneError || emailError || nameError);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wc-blue-800)]/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-wc-xl bg-[var(--wc-bg-elevated)] p-6 shadow-wc-xl">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("add_client")}
        </h2>

        <Input
          label={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, name: true }))}
          error={nameError}
          autoFocus
          required
        />

        <Input
          label={t("phone")}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, phone: true }))}
          error={phoneError}
          placeholder="+5511999990000"
          required
        />

        <Input
          label={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, email: true }))}
          error={emailError}
        />

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
            loading={create.isPending}
            disabled={create.isPending || !name || !phone || hasErrors}
          >
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
