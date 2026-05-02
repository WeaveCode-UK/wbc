"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  EmptyState,
  Input,
  SegmentedControl,
  StepIndicator,
} from "@wbc/ui";

const TOTAL_STEPS = 3;

export default function NewCampaignPage() {
  const t = useTranslations("campaigns");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState("BY_TAG");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const previous = () => setStep((s) => Math.max(1, s - 1));

  const stepTitle =
    step === 1
      ? t("wizard_step_recipients")
      : step === 2
        ? t("wizard_step_message")
        : t("wizard_step_review");

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/campaigns"
        className="text-body-small text-[var(--color-primary)] hover:underline"
      >
        ← {t("back_to_list")}
      </Link>

      <header className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("new_campaign")}
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
              {t("recipients")}
            </h2>
            <SegmentedControl
              value={audience}
              onChange={setAudience}
              options={[
                {
                  value: "BY_TAG",
                  label: t("wizard_recipients_by_tag"),
                },
                {
                  value: "INDIVIDUAL",
                  label: t("wizard_recipients_individual"),
                },
                {
                  value: "ALL",
                  label: t("wizard_recipients_all"),
                },
              ]}
            />
            <EmptyState
              icon="🏷️"
              title={`0 ${t("wizard_recipients_summary")}`}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-heading-2 text-[var(--color-text-primary)]">
              {t("wizard_message_title")}
            </h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("wizard_message_placeholder")}
              className="w-full min-h-[120px] rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-3 text-body-small text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {t("wizard_message_variables")}
            </p>

            <div className="rounded-md bg-[var(--color-primary-surface)] p-3">
              <p className="text-body-small text-[var(--color-primary)]">
                {t("wizard_ai_assist")}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
              >
                {t("wizard_ai_generate")}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {t("wizard_attachments")}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button type="button" variant="ghost" size="sm">
                  {t("wizard_attach_photo")}
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  {t("wizard_attach_audio")}
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  {t("wizard_attach_pdf")}
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  {t("wizard_attach_video")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {t("wizard_schedule_title")}
              </p>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </>
        )}

        {step === 3 && (
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
                  {t("recipients")}
                </span>
                <span className="text-[var(--color-text-primary)]">
                  {audience}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-tertiary)]">
                  {t("schedule")}
                </span>
                <span className="text-[var(--color-text-primary)]">
                  {scheduledAt || "—"}
                </span>
              </div>
              <div className="border-t border-[var(--color-border-tertiary)] pt-2">
                <p className="text-[var(--color-text-tertiary)]">
                  {t("wizard_message_title")}
                </p>
                <p className="mt-1 whitespace-pre-line text-[var(--color-text-primary)]">
                  {message || "—"}
                </p>
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
          {tCommon("previous")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary">
            {t("wizard_test_send")}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={next}>
              {tCommon("next")}
            </Button>
          ) : (
            <Button type="button" variant="success">
              {t("wizard_confirm")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
