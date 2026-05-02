"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, ToggleSwitch } from "@wbc/ui";
import { Label } from "@wbc/ui/components/label";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const [active, setActive] = useState(true);
  const [bio, setBio] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [slug, setSlug] = useState("");

  const publicUrl = slug ? `https://wbc.com.br/${slug}` : "—";

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
            {t("title")}
          </h1>
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ToggleSwitch checked={active} onChange={setActive} />
          <span className="text-caption text-[var(--color-text-tertiary)]">
            {t("active_label")}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("preview_title")}
          </h2>
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {t("preview_hint")}
          </p>
          <div className="aspect-[9/16] w-full max-w-sm rounded-lg bg-gradient-to-br from-[var(--color-primary-surface)] to-[var(--color-bg-secondary)] p-4">
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="h-20 w-20 rounded-full bg-[var(--color-bg-primary)]" />
              <p className="text-body text-[var(--color-text-primary)]">
                {bio || "—"}
              </p>
              <Button type="button" size="sm">
                {t("field_whatsapp")}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-4">
          <h2 className="text-heading-2 text-[var(--color-text-primary)]">
            {t("form_title")}
          </h2>

          <div className="space-y-1">
            <Label>{t("field_photo")}</Label>
            <Input type="file" accept="image/*" />
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {t("field_photo_hint")}
            </p>
          </div>

          <div className="space-y-1">
            <Label>{t("field_bio")}</Label>
            <Input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={120}
            />
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {t("field_bio_hint")}
            </p>
          </div>

          <div className="space-y-1">
            <Label>{t("field_philosophy")}</Label>
            <textarea
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 text-body-small text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="space-y-1">
            <Label>{t("field_whatsapp")}</Label>
            <Input
              type="url"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://wa.me/55..."
            />
          </div>

          <div className="space-y-1">
            <Label>{t("field_slug")}</Label>
            <Input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="renata-cosmeticos"
            />
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {publicUrl}
            </p>
          </div>

          <div className="border-t border-[var(--color-border-tertiary)] pt-3 space-y-2">
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {t("share_link")}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm">
                {t("copy_link")}
              </Button>
              <Button type="button" variant="ghost" size="sm">
                {t("share_link_action")}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button">{tCommon("save")}</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
