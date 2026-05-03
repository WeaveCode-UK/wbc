"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input, SegmentedControl } from "@wbc/ui";
import { Label } from "@wbc/ui/components/label";
import { trpc } from "@/lib/trpc";

type Template = "minimal" | "bold" | "festive" | "elegant";

export default function NewPromoCardPage() {
  const tCommon = useTranslations("common");
  const [template, setTemplate] = useState<Template>("minimal");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [cta, setCta] = useState("Fale comigo no WhatsApp");

  const generate = trpc.platform.generatePromoCard.useMutation();

  const onGenerate = () => {
    if (!title) return;
    generate.mutate({
      template,
      title,
      brand: brand || undefined,
      price: price ? Number(price) : undefined,
      callToAction: cta || undefined,
    });
  };

  const dataUrl = generate.data?.dataUrl ?? null;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/campaigns"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← Campanhas
      </Link>

      <header>
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Card promocional
        </h1>
        <p className="text-[13px] sm:text-[14px] font-light text-[var(--wc-fg-2)]">
          1080×1080 · pronto pra Instagram, Stories e WhatsApp
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 space-y-4">
          <div className="space-y-1">
            <Label>Template</Label>
            <SegmentedControl
              value={template}
              onChange={(v) => setTemplate(v as Template)}
              options={[
                { value: "minimal", label: "Minimal" },
                { value: "bold", label: "Bold" },
                { value: "festive", label: "Festive" },
                { value: "elegant", label: "Elegant" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Lançamento Mary Kay"
            />
          </div>

          <div className="space-y-1">
            <Label>Marca</Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Mary Kay"
            />
          </div>

          <div className="space-y-1">
            <Label>Preço (BRL)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="89.90"
            />
          </div>

          <div className="space-y-1">
            <Label>Chamada</Label>
            <Input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              maxLength={40}
            />
          </div>

          {generate.error && (
            <Alert variant="danger">{generate.error.message}</Alert>
          )}

          <Button
            type="button"
            onClick={onGenerate}
            loading={generate.isPending}
            disabled={!title || generate.isPending}
          >
            {tCommon("create")}
          </Button>
        </section>

        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 space-y-3">
          <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
            Pré-visualização
          </h2>
          {!dataUrl && (
            <div className="aspect-square rounded-md bg-[var(--wc-bg-muted)] flex items-center justify-center text-[var(--wc-fg-3)]">
              {tCommon("loading")}
            </div>
          )}
          {dataUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dataUrl} alt="promo" className="w-full rounded-md" />
              <div className="flex gap-2">
                <a href={dataUrl} download={`promo-${template}.svg`}>
                  <Button type="button" size="sm">
                    SVG
                  </Button>
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    generate.data?.svg &&
                    navigator.clipboard.writeText(generate.data.svg)
                  }
                >
                  {tCommon("copy")}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
