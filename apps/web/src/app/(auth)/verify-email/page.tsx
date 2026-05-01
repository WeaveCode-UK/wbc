"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@wbc/ui/components/button";
import { useTranslations } from "next-intl";

function VerifyEmailContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("verifyEmail.invalidTitle")}</h1>
        <p className="text-muted-foreground">
          {t("verifyEmail.invalidDescription")}
        </p>
        <Link href="/login">
          <Button>{t("resetPassword.backToLogin")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">{t("verifyEmail.title")}</h1>
      <p className="text-muted-foreground">{t("verifyEmail.description")}</p>
      <Link href="/">
        <Button>{t("verifyEmail.continue")}</Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
