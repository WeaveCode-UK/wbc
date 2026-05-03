"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { Alert, Button } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

// F11.E07 part C: this page renders the consultora's self-registration
// QR. The QR encodes the public landing URL `<LANDING_URL>/cadastro/
// <tenantSlug>`; the slug is read from session via auth.listWorkspaces
// or directly from the JWT (token.tid → tenant.slug). For dev we fall
// back to localhost:3001.

const LANDING_BASE_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3001";

interface Workspace {
  tenantId: string;
  slug: string;
  tenantName: string;
}

export default function ClientsQrPage() {
  const t = useTranslations("clients");
  const { data: session } = useSession();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const workspaces = trpc.auth.listWorkspaces.useQuery(undefined, {
    enabled: !!session,
  });

  const list = (workspaces.data?.workspaces ?? []) as Workspace[];
  const activeTenantId = (session?.user as { tenantId?: string } | undefined)
    ?.tenantId;
  const slug = list.find((w) => w.tenantId === activeTenantId)?.slug ?? "";
  const url = slug ? `${LANDING_BASE_URL}/cadastro/${slug}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then(setDataUrl)
      .catch((err) =>
        setRenderError(err instanceof Error ? err.message : String(err)),
      );
  }, [url]);

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/clients"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {t("title")}
      </Link>

      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("qr_title")}
        </h1>
        <p className="mt-1 text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          {t("qr_subtitle")}
        </p>
      </header>

      {!slug && !workspaces.isLoading && (
        <Alert variant="warning">{t("qr_no_workspace")}</Alert>
      )}

      {renderError && <Alert variant="danger">{renderError}</Alert>}

      {dataUrl && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-4 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="QR Code"
            width={320}
            height={320}
            className="rounded-md"
          />
          <p className="text-[13px] text-[var(--wc-fg-1)] break-all text-center">
            {url}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(url)}
            >
              {t("qr_copy_link")}
            </Button>
            <a href={dataUrl} download={`wbc-qr-${slug}.png`}>
              <Button type="button" size="sm">
                {t("qr_download_png")}
              </Button>
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
