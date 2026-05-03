import Link from "next/link";
import { useTranslations } from "next-intl";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { CredentialsForm } from "@/components/auth/credentials-form";

export default function RegisterPage() {
  const t = useTranslations("auth");

  return (
    <>
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("register.title")}
        </h1>
        <p className="mt-1 text-[13px] font-light text-[var(--wc-fg-3)]">
          {t("register.subtitle")}
        </p>
      </header>

      <CredentialsForm mode="register" />

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.1em] text-[var(--wc-fg-3)]">
        <span
          className="h-px flex-1 bg-[var(--wc-border)]"
          aria-hidden="true"
        />
        {t("login.or")}
        <span
          className="h-px flex-1 bg-[var(--wc-border)]"
          aria-hidden="true"
        />
      </div>

      <GoogleLoginButton />

      <div className="text-center text-[12px] text-[var(--wc-fg-3)]">
        {t("register.hasAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--wc-purple)] hover:text-[var(--wc-purple-600)]"
        >
          {t("register.signIn")}
        </Link>
      </div>
    </>
  );
}
