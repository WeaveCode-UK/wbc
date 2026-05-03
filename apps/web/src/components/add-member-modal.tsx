"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11 follow-up: lightweight modal that wraps team.addMember. The
// /team page button used to render with no onClick — this modal
// fills the gap and reuses the same validation pattern as
// AddClientModal (E.164 phone, blur-driven inline errors).

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
}

const ROLES = [
  { value: "CONSULTANT", label: "Consultora" },
  { value: "LEADER", label: "Líder" },
  { value: "DIRECTOR", label: "Diretora" },
  { value: "ADMIN", label: "Admin" },
] as const;

export function AddMemberModal({ open, onClose }: AddMemberModalProps) {
  const t = useTranslations("team");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] =
    useState<(typeof ROLES)[number]["value"]>("CONSULTANT");
  const [touched, setTouched] = useState({ name: false, phone: false });

  const phoneError =
    touched.phone && phone && !/^\+\d{10,15}$/.test(phone)
      ? "Use formato internacional, ex: +5511999990000"
      : undefined;
  const nameError = touched.name && !name ? "Nome obrigatório" : undefined;
  const hasErrors = Boolean(phoneError || nameError);

  const utils = trpc.useUtils();
  const add = trpc.team.addMember.useMutation({
    onSuccess: (member) => {
      toast.success(`${member.name || "Membro"} adicionada`);
      void utils.team.listMembers.invalidate();
      void utils.team.getRanking.invalidate();
      setName("");
      setPhone("");
      setRole("CONSULTANT");
      setTouched({ name: false, phone: false });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!open) return null;

  const submit = () => {
    if (!name || !phone) return;
    add.mutate({ name, phone, role });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("add_member")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-xl space-y-4">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("add_member")}
        </h2>

        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, name: true }))}
          error={nameError}
          autoFocus
          required
        />

        <Input
          label="Telefone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, phone: true }))}
          error={phoneError}
          placeholder="+5511999990000"
          required
        />

        <div className="space-y-1">
          <label
            htmlFor="member-role"
            className="block text-caption text-[var(--color-text-tertiary)]"
          >
            Papel
          </label>
          <select
            id="member-role"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as (typeof ROLES)[number]["value"])
            }
            className="h-10 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] px-3 text-body-small text-[var(--color-text-primary)]"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {add.error && <Alert variant="danger">{add.error.message}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={submit}
            loading={add.isPending}
            disabled={add.isPending || !name || !phone || hasErrors}
          >
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
