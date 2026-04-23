"use client";

import { useTranslations } from "next-intl";
import { Button, EmptyState } from "@wbc/ui";

export default function ClientsPage() {
  const t = useTranslations("clients");
  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm">
          {t("add_client")}
        </Button>
      </div>
      <div className="mt-6 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
        <EmptyState
          icon="👥"
          title={t("no_clients")}
          description={t("no_clients_hint")}
          action={
            <Button type="button" size="sm">
              {t("add_client")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
