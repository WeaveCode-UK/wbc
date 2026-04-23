"use client";

import { useId, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@wbc/ui/components/button";
import { FormField } from "../../../../components/form-field";
import { phoneDigits } from "../../../../lib/masks";

// ACH-017 (partial seed): real Profile form with schema and submit handler
// shape. Actual persistence endpoint is out of scope for this correction —
// submit currently posts to a stubbed route and surfaces success/error
// through local state. docs/UI-SETTINGS-FOLLOWUP.md tracks the remaining work.
const profileSchema = z.object({
  displayName: z.string().min(2),
  phone: z.string().min(10),
  bio: z.string().max(280).optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

type SubmitStatus = "idle" | "saving" | "saved" | "error";

export function ProfileSettingsForm() {
  const t = useTranslations("platform");
  const tCommon = useTranslations("common");
  const statusId = useId();
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "", phone: "", bio: "" },
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    setStatus("saving");
    try {
      const res = await fetch("/api/trpc/platform.updateProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          phone: phoneDigits(values.phone),
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 sm:p-6"
        aria-describedby={statusId}
      >
        <header>
          <h2 className="text-heading-3 text-[var(--color-text-primary)]">
            {t("profile")}
          </h2>
          <p className="mt-1 text-body-small text-[var(--color-text-tertiary)]">
            {t("profile_hint")}
          </p>
        </header>

        <FormField name="displayName" label={t("profile")} />
        <FormField
          name="phone"
          label="Telefone"
          type="tel"
          placeholder="(11) 99999-9999"
        />
        <FormField name="bio" label="Bio" helper="Até 280 caracteres" />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "..." : tCommon("save")}
          </Button>
          <p
            id={statusId}
            aria-live="polite"
            className="text-caption text-[var(--color-text-tertiary)]"
          >
            {status === "saved" && "Salvo"}
            {status === "error" && tCommon("error")}
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
