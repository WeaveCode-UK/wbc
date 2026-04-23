"use client";

import { useTranslations } from "next-intl";
import { Button, EmptyState } from "@wbc/ui";

export default function SalesPage() {
  const t = useTranslations("sales");
  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm">
          {t("new_sale")}
        </Button>
      </div>
      <div className="mt-6 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
        <EmptyState
          icon="💰"
          title={t("no_sales")}
          description={t("no_sales_hint")}
          action={
            <Button type="button" size="sm">
              {t("new_sale")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
