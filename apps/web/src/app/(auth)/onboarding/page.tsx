"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@wbc/ui/components/button";
import { Input } from "@wbc/ui/components/input";
import { Label } from "@wbc/ui/components/label";
import { StepIndicator } from "@wbc/ui/components/step-indicator";
import { useTranslations } from "next-intl";
import { maskPhoneBR, phoneDigits } from "../../../lib/masks";

export default function OnboardingPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [tenantName, setTenantName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stable ids — ACH-024: avoid relying on label-text derivation which breaks
  // under i18n (accented/special chars) or name collisions.
  const nameId = useId();
  const slugId = useId();
  const phoneId = useId();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setTenantName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trpc/auth.completeOnboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantName, slug, phone: phoneDigits(phone) }),
      });
      if (!res.ok) {
        setError(t("onboarding.error"));
        return;
      }
      await update({});
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("onboarding.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("onboarding.title")}</h1>
        <StepIndicator total={3} current={step - 1} className="mt-3" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t("onboarding.step", { current: step, total: 3 })}
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>{t("onboarding.businessName")}</Label>
            <Input
              id={nameId}
              value={tenantName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={slugId}>{t("onboarding.slug")}</Label>
            <Input
              id={slugId}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="^[a-z0-9-]+$"
              aria-describedby={`${slugId}-hint`}
            />
            <p id={`${slugId}-hint`} className="text-xs text-muted-foreground">
              {t("onboarding.slugHint")}
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => setStep(2)}
            disabled={!tenantName || !slug}
          >
            {t("onboarding.next")}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={phoneId}>{t("onboarding.phone")}</Label>
            <Input
              id={phoneId}
              value={phone}
              onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
              placeholder="(11) 99999-9999"
              required
              minLength={14}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              className="flex-1"
              onClick={() => setStep(3)}
              disabled={!phone}
            >
              {t("onboarding.next")}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <p>
              <strong>{t("onboarding.businessName")}:</strong> {tenantName}
            </p>
            <p>
              <strong>{t("onboarding.slug")}:</strong> {slug}
            </p>
            <p>
              <strong>{t("onboarding.phone")}:</strong> {phone}
            </p>
          </div>

          {/* ACH-019 compliance-privacidade: explicit notice of international
              data transfers; ACH-022: link to data-subject rights. */}
          <div className="rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] p-3 text-caption space-y-2">
            <p>
              Ao continuar, você concorda que seus dados serão processados pela
              WeaveCode Ltd (UK) e por sub-processadores em USA, Argentina e
              China — detalhes em{" "}
              <a
                href="/privacy-policy"
                className="text-[var(--color-primary)] hover:underline"
              >
                Política de Privacidade
              </a>
              .
            </p>
            <p className="text-[var(--color-text-tertiary)]">
              <a href="/privacy-policy#direitos" className="hover:underline">
                Conheça seus direitos (LGPD art. 18-22)
              </a>
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(2)}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "..." : t("onboarding.finish")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
