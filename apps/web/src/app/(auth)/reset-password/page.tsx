"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@wbc/ui/components/button";
import { Input } from "@wbc/ui/components/input";
import { Label } from "@wbc/ui/components/label";
import { ConfirmModal } from "@wbc/ui/components/confirm-modal";
import { useTranslations } from "next-intl";
import { DataRightsLink } from "../../../components/data-rights-link";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setLoading(true);
    try {
      await fetch("/api/trpc/auth.requestPasswordReset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("resetPassword.sentTitle")}</h1>
        <p className="text-muted-foreground">
          {t("resetPassword.sentDescription")}
        </p>
        <Link href="/login">
          <Button variant="outline">{t("resetPassword.backToLogin")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("resetPassword.title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("resetPassword.subtitle")}
        </p>
      </div>

      <form onSubmit={handleOpenConfirm} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("login.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? "..." : t("resetPassword.submit")}
        </Button>
      </form>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSend}
        title={t("resetPassword.confirmTitle")}
        description={t("resetPassword.confirmDescription", { email })}
        confirmLabel={t("resetPassword.confirmSend")}
        cancelLabel={tCommon("cancel")}
        isLoading={loading}
      />

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          {t("resetPassword.backToLogin")}
        </Link>
      </div>

      <div className="text-center">
        <DataRightsLink />
      </div>
    </div>
  );
}
