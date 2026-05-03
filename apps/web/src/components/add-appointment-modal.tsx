"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

type AppointmentType = "VISIT" | "DEMO" | "BEAUTY_DAY" | "DELIVERY" | "OTHER";

interface AddAppointmentModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddAppointmentModal({
  open,
  onClose,
}: AddAppointmentModalProps) {
  const t = useTranslations("schedule");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AppointmentType>("VISIT");
  const [startsAt, setStartsAt] = useState("");
  const [address, setAddress] = useState("");

  const utils = trpc.useUtils();
  const create = trpc.schedule.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Compromisso criado");
      void utils.schedule.listAppointments.invalidate();
      setTitle("");
      setStartsAt("");
      setAddress("");
      setType("VISIT");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!open) return null;

  const submit = () => {
    if (!title || !startsAt) return;
    create.mutate({
      title,
      type,
      startsAt: new Date(startsAt),
      address: address || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("new_appointment")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--wc-blue-800)]/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md space-y-4 rounded-wc-xl bg-[var(--wc-bg-elevated)] p-6 shadow-wc-xl">
        <h2 className="text-heading-2 text-[var(--color-text-primary)]">
          {t("new_appointment")}
        </h2>

        <Input
          label={t("appointment_title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div>
          <label className="block text-caption font-medium text-[var(--color-text-secondary)] mb-1">
            {t("type")}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AppointmentType)}
            className="h-11 w-full rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] px-3 text-[13px] text-[var(--wc-fg-1)]"
          >
            <option value="VISIT">{t("type_visit")}</option>
            <option value="DEMO">{t("type_demo")}</option>
            <option value="BEAUTY_DAY">{t("type_beauty_day")}</option>
            <option value="DELIVERY">{t("type_delivery")}</option>
            <option value="OTHER">{t("type_other")}</option>
          </select>
        </div>

        <Input
          label={t("starts_at")}
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />

        <Input
          label={t("address")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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
            disabled={create.isPending || !title || !startsAt}
          >
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
