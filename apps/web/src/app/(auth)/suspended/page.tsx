import { useTranslations } from "next-intl";

export default function SuspendedPage() {
  const t = useTranslations("auth");

  return (
    <div className="text-center space-y-4">
      <h1 className="text-[26px] font-semibold tracking-tight text-text-primary">
        {t("suspended.title")}
      </h1>
      <p className="text-text-tertiary">{t("suspended.description")}</p>
      <p className="text-sm text-text-tertiary">{t("suspended.contact")}</p>
    </div>
  );
}
