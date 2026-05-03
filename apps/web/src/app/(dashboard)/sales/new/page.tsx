"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Avatar,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
  SearchBar,
  SegmentedControl,
  StepIndicator,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

const TOTAL_STEPS = 4;

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function NewSalePage() {
  const t = useTranslations("sales");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [deliveryMethod, setDeliveryMethod] = useState("PICKUP");
  const [discount, setDiscount] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clients = trpc.clients.list.useQuery({
    page: 1,
    limit: 20,
    search: clientSearch || undefined,
  });

  const products = trpc.catalog.listProducts.useQuery({
    search: productSearch || undefined,
  });

  const createSale = trpc.sales.create.useMutation({
    onSuccess: (sale) => {
      router.push(`/sales`);
      void sale;
    },
    onError: (error) => {
      setSubmitError(error.message);
    },
  });

  const selectedClient = clients.data?.data.find(
    (c) => c.id === selectedClientId,
  );

  const total = cart.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const discountValue = Number(discount) || 0;
  const finalTotal = Math.max(0, total - discountValue);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const previous = () => setStep((s) => Math.max(1, s - 1));

  const canAdvance =
    (step === 1 && !!selectedClientId) ||
    (step === 2 && cart.length > 0) ||
    step === 3 ||
    step === 4;

  const stepTitle =
    step === 1
      ? t("wizard_step_client")
      : step === 2
        ? t("wizard_step_products")
        : step === 3
          ? t("wizard_step_payment")
          : t("wizard_step_review");

  const addToCart = (productId: string, name: string, unitPrice: number) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.productId === productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { productId, name, unitPrice, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((p) => p.productId !== productId));
  };

  const submit = () => {
    if (!selectedClientId || cart.length === 0) return;
    setSubmitError(null);
    createSale.mutate({
      clientId: selectedClientId,
      items: cart.map(({ productId, quantity, unitPrice }) => ({
        productId,
        quantity,
        unitPrice,
      })),
      paymentMethod,
      discount: discountValue > 0 ? discountValue : undefined,
    });
  };

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

      {submitError && <Alert variant="danger">{submitError}</Alert>}

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-4">
        {step === 1 && (
          <>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("wizard_select_client")}
            </h2>
            <SearchBar
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              onClear={() => setClientSearch("")}
              placeholder={t("wizard_search_client")}
            />
            {clients.isLoading && <ListSkeleton count={4} />}
            {!clients.isLoading && (clients.data?.data.length ?? 0) === 0 && (
              <EmptyState icon="👤" title={t("wizard_no_clients")} />
            )}
            {!clients.isLoading &&
              clients.data?.data.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClientId(c.id)}
                  className={
                    "w-full text-left rounded-md border-2 transition-colors " +
                    (selectedClientId === c.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]"
                      : "border-transparent hover:bg-[var(--color-bg-secondary)]")
                  }
                >
                  <ListItem
                    avatar={
                      <Avatar
                        name={c.name}
                        size="md"
                        classification={
                          c.classification as "A" | "B" | "C" | undefined
                        }
                      />
                    }
                    title={c.name}
                    subtitle={c.phone}
                    separator={false}
                  />
                </button>
              ))}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("wizard_select_products")}
            </h2>
            <SearchBar
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onClear={() => setProductSearch("")}
              placeholder={t("wizard_search_product")}
            />

            {cart.length > 0 && (
              <div className="rounded-md bg-[var(--color-bg-secondary)] p-3 space-y-2">
                <p className="text-caption text-[var(--color-text-tertiary)]">
                  {t("items")} · {cart.length}
                </p>
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-body-small"
                  >
                    <span className="text-[var(--color-text-primary)] truncate">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[var(--color-text-primary)]">
                        {formatBRL(item.unitPrice * item.quantity)}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[var(--color-danger-text)] hover:opacity-70"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[var(--color-border-tertiary)] pt-2 text-body-small font-medium text-[var(--color-text-primary)]">
                  <span>{t("total")}</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>
            )}

            {products.isLoading && <ListSkeleton count={4} />}
            {!products.isLoading && (products.data?.length ?? 0) === 0 && (
              <EmptyState icon="🛍️" title={t("wizard_no_products")} />
            )}
            {!products.isLoading &&
              products.data?.map((p) => (
                <ListItem
                  key={p.id}
                  title={p.name}
                  subtitle={`${formatBRL(Number(p.price))}`}
                  right={
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => addToCart(p.id, p.name, Number(p.price))}
                    >
                      +
                    </Button>
                  }
                />
              ))}
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
              <Input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0,00"
              />
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
            <div className="space-y-2 rounded-md bg-[var(--color-bg-secondary)] p-3 text-body-small">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-tertiary)]">
                  {t("wizard_step_client")}
                </span>
                <span className="text-[var(--color-text-primary)]">
                  {selectedClient?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-tertiary)]">
                  {t("items")}
                </span>
                <span className="text-[var(--color-text-primary)]">
                  {cart.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-tertiary)]">
                  {t("payment_method")}
                </span>
                <span className="text-[var(--color-text-primary)]">
                  {paymentMethod}
                </span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)]">
                    {t("discount")}
                  </span>
                  <span className="text-[var(--color-text-primary)]">
                    -{formatBRL(discountValue)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--color-border-tertiary)] pt-2 text-heading-2 text-[var(--color-text-primary)]">
                <span>{t("total")}</span>
                <span>{formatBRL(finalTotal)}</span>
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
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={next} disabled={!canAdvance}>
              {t("wizard_next")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              onClick={submit}
              loading={createSale.isPending}
              disabled={
                createSale.isPending || cart.length === 0 || !selectedClientId
              }
            >
              {tCommon("confirm")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
