"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input, ToggleSwitch } from "@wbc/ui";
import { Label } from "@wbc/ui/components/label";
import { trpc } from "@/lib/trpc";

interface LandingDoc {
  isActive: boolean;
  bio: string | null;
  philosophy: string | null;
  photoUrl: string | null;
  whatsappLink: string | null;
  slug?: string | null;
}

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  const landing = trpc.landing.get.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.landing.update.useMutation({
    onSuccess: () => {
      void utils.landing.get.invalidate();
      setNotice(tCommon("save"));
    },
    onError: (err) => setNotice(err.message),
  });
  const toggleActive = trpc.landing.toggleActive.useMutation({
    onSuccess: () => {
      void utils.landing.get.invalidate();
    },
  });

  const data = landing.data as LandingDoc | null | undefined;

  const [bio, setBio] = useState("");
  const [philosophy, setPhilosophy] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setBio(data.bio ?? "");
    setPhilosophy(data.philosophy ?? "");
    setWhatsapp(data.whatsappLink ?? "");
    setPhotoUrl(data.photoUrl ?? "");
  }, [data]);

  const slug = data?.slug ?? "";
  const publicUrl = slug ? `https://wbc.com.br/${slug}` : "—";

  const onSave = () => {
    setNotice(null);
    update.mutate({
      bio: bio || undefined,
      philosophy: philosophy || undefined,
      photoUrl: photoUrl || undefined,
      whatsappLink: whatsapp || undefined,
    });
  };

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
          <ToggleSwitch
            checked={data?.isActive ?? false}
            onChange={(value) => toggleActive.mutate({ isActive: value })}
            disabled={landing.isLoading || toggleActive.isPending}
          />
          <span className="text-caption text-[var(--color-text-tertiary)]">
            {t("active_label")}
          </span>
        </div>
      </header>

      {notice && (
        <Alert variant={update.error ? "danger" : "success"}>{notice}</Alert>
      )}

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
              <div className="h-20 w-20 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
                {photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
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
            <Input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
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
              disabled
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
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => slug && navigator.clipboard.writeText(publicUrl)}
                disabled={!slug}
              >
                {t("copy_link")}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={!slug}>
                {t("share_link_action")}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={update.isPending || landing.isLoading}
            >
              {update.isPending ? "..." : tCommon("save")}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
