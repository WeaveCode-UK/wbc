"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Input } from "@wbc/ui";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/providers/toast-provider";

// F11 follow-up: PIX merchant config. The 4 fields below feed the
// BR Code generator (use-case generate-pix). Without these the
// "Gerar PIX" button on a sale stays disabled.

const KEY_TYPES = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "RANDOM", label: "Chave aleatória" },
] as const;

type KeyType = (typeof KEY_TYPES)[number]["value"];

export default function PixSettingsPage() {
  const tCommon = useTranslations("common");
  const toast = useToast();
  const config = trpc.platform.getPixConfig.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.platform.updatePixConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração PIX salva");
      void utils.platform.getPixConfig.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<KeyType>("CPF");
  const [merchantName, setMerchantName] = useState("");
  const [merchantCity, setMerchantCity] = useState("");

  useEffect(() => {
    if (!config.data) return;
    setPixKey(config.data.pixKey ?? "");
    setPixKeyType(((config.data.pixKeyType as KeyType) ?? "CPF") as KeyType);
    setMerchantName(config.data.pixMerchantName ?? "");
    setMerchantCity(config.data.pixMerchantCity ?? "");
  }, [config.data]);

  const isDirty =
    config.data &&
    (config.data.pixKey !== pixKey ||
      config.data.pixKeyType !== pixKeyType ||
      config.data.pixMerchantName !== merchantName ||
      config.data.pixMerchantCity !== merchantCity);
  const canSubmit =
    pixKey.trim().length > 0 &&
    merchantName.trim().length > 0 &&
    merchantCity.trim().length > 0;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <Link
        href="/settings"
        className="text-[13px] text-[var(--wc-purple)] hover:underline"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        PIX
      </h1>

      <Alert variant="ia">
        Configure aqui pra gerar QR Code "copia e cola" direto da venda. A chave
        fica no seu banco — o WBC só monta o BR Code padrão BACEN, sem
        intermediar pagamento.
      </Alert>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] shadow-wc-xs p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="pix-key-type"
            className="block text-[12px] text-[var(--wc-fg-3)]"
          >
            Tipo de chave
          </label>
          <select
            id="pix-key-type"
            value={pixKeyType}
            onChange={(e) => setPixKeyType(e.target.value as KeyType)}
            className="h-10 w-full rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] px-3 text-[13px] text-[var(--wc-fg-1)]"
          >
            {KEY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Chave PIX"
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="Ex: 12345678900, +5511999990000, voce@email.com"
          required
        />

        <Input
          label="Nome do recebedor (max 25)"
          value={merchantName}
          onChange={(e) => setMerchantName(e.target.value.slice(0, 25))}
          maxLength={25}
          required
          helper="Mostrado no app do banco da cliente"
        />

        <Input
          label="Cidade (max 15)"
          value={merchantCity}
          onChange={(e) => setMerchantCity(e.target.value.slice(0, 15))}
          maxLength={15}
          required
        />

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={() =>
              update.mutate({
                pixKey,
                pixKeyType,
                pixMerchantName: merchantName,
                pixMerchantCity: merchantCity,
              })
            }
            loading={update.isPending}
            disabled={!isDirty || !canSubmit || update.isPending}
          >
            {tCommon("save")}
          </Button>
        </div>
      </section>
    </div>
  );
}
