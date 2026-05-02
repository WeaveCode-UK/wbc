"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  EmptyState,
  Input,
  SearchBar,
  SegmentedControl,
  StepIndicator,
} from "@wbc/ui";

const TOTAL_STEPS = 4;

export default function NewSalePage() {
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [deliveryMethod, setDeliveryMethod] = useState("PICKUP");

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const previous = () => setStep((s) => Math.max(1, s - 1));

  const stepTitle =
    step === 1
      ? t("wizard_step_client")
      : step === 2
        ? t("wizard_step_products")
        : step === 3
          ? t("wizard_step_payment")
          : t("wizard_step_review");

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/sales"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {t("wizard_back")}
      </Link>

      <header className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("new_sale")}
        </h1>
        <span className="text-caption text-[var(--color-text-tertiary)]">
          {step}/{TOTAL_STEPS} · {stepTitle}
        </span>
      </header>

      <StepIndicator total={TOTAL_STEPS} current={step} />

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-4">
        {step === 1 && (
          <>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("wizard_select_client")}
            </h2>
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("wizard_search_client")}
            />
            <EmptyState icon="👤" title={t("wizard_no_clients")} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("wizard_select_products")}
            </h2>
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("wizard_search_product")}
            />
            <EmptyState icon="🛍️" title={t("wizard_no_products")} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("wizard_payment_title")}
            </h2>

            <div className="space-y-2">
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {t("wizard_payment_method")}
              </p>
              <SegmentedControl
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: "CASH", label: t("wizard_payment_cash") },
                  { value: "PIX", label: t("wizard_payment_pix") },
                  { value: "CREDIT_CARD", label: t("wizard_payment_card") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {t("wizard_delivery_method")}
              </p>
              <SegmentedControl
                value={deliveryMethod}
                onChange={setDeliveryMethod}
                options={[
                  { value: "PICKUP", label: t("wizard_delivery_pickup") },
                  { value: "DELIVERY", label: t("wizard_delivery_delivery") },
                  { value: "SHIPPING", label: t("wizard_delivery_shipping") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {t("discount")}
              </p>
              <Input type="number" min={0} step="0.01" placeholder="0,00" />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("wizard_review_title")}
            </h2>
            <p className="text-body-small text-[var(--color-text-secondary)]">
              {t("wizard_review_hint")}
            </p>
            <div className="space-y-2 rounded-md bg-[var(--color-bg-secondary)] p-3">
              <div className="flex justify-between text-body-small">
                <span className="text-[var(--color-text-tertiary)]">
                  {t("items")}
                </span>
                <span className="text-[var(--color-text-primary)]">—</span>
              </div>
              <div className="flex justify-between text-body-small">
                <span className="text-[var(--color-text-tertiary)]">
                  {t("payment_method")}
                </span>
                <span className="text-[var(--color-text-primary)]">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-heading-2 text-[var(--color-text-primary)]">
                <span>{t("total")}</span>
                <span>R$ —</span>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={previous}
          disabled={step === 1}
        >
          {t("wizard_previous")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary">
            {t("wizard_save_draft")}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={next}>
              {t("wizard_next")}
            </Button>
          ) : (
            <Button type="button" variant="success">
              {tCommon("confirm")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
