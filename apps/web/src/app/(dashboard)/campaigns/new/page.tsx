"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Button,
  EmptyState,
  FilterChips,
  Input,
  ListItem,
  ListSkeleton,
  SegmentedControl,
  StepIndicator,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

const TOTAL_STEPS = 3;

type Audience = "BY_TAG" | "INDIVIDUAL" | "ALL";

export default function NewCampaignPage() {
  const t = useTranslations("campaigns");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState<Audience>("BY_TAG");
  const [tagId, setTagId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set(),
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clients = trpc.clients.list.useQuery({
    page: 1,
    limit: 100,
    tagIds: audience === "BY_TAG" && tagId ? [tagId] : undefined,
  });

  const tags = trpc.clients.listTags.useQuery();

  const create = trpc.campaigns.create.useMutation({
    onSuccess: () => router.push("/campaigns"),
    onError: (error) => setSubmitError(error.message),
  });
  const generateAi = trpc.ai.generateCampaignText.useMutation({
    onSuccess: (result) => setMessage(result.text),
  });

  const tagChips = (tags.data ?? []).map((tag) => ({
    value: tag.id,
    label: tag.name,
    color: tag.color ?? undefined,
  }));

  const recipientIds: string[] =
    audience === "ALL"
      ? (clients.data?.data.map((c) => c.id) ?? [])
      : audience === "BY_TAG"
        ? (clients.data?.data.map((c) => c.id) ?? [])
        : Array.from(selectedClientIds);

  const recipientCount = recipientIds.length;

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const previous = () => setStep((s) => Math.max(1, s - 1));

  const canAdvance =
    (step === 1 && recipientCount > 0) ||
    (step === 2 && message.trim().length > 0 && name.trim().length > 0) ||
    step === 3;

  const submit = () => {
    setSubmitError(null);
    create.mutate({
      name,
      message,
      recipientIds,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });
  };

  const stepTitle =
    step === 1
      ? t("wizard_step_recipients")
      : step === 2
        ? t("wizard_step_message")
        : t("wizard_step_review");

  const toggleClient = (id: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <Link
        href="/campaigns"
        className="text-body-small text-[var(--wc-purple)] hover:underline"
      >
        ← {t("back_to_list")}
      </Link>

      <header className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("new_campaign")}
        </h1>
        <span className="text-caption text-[var(--wc-fg-3)]">
          {step}/{TOTAL_STEPS} · {stepTitle}
        </span>
      </header>

      <StepIndicator total={TOTAL_STEPS} current={step} />

      {submitError && <Alert variant="danger">{submitError}</Alert>}

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white p-4 space-y-4 shadow-wc-xs">
        {step === 1 && (
          <>
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("recipients")}
            </h2>
            <SegmentedControl
              value={audience}
              onChange={(v) => setAudience(v as Audience)}
              options={[
                { value: "BY_TAG", label: t("wizard_recipients_by_tag") },
                {
                  value: "INDIVIDUAL",
                  label: t("wizard_recipients_individual"),
                },
                { value: "ALL", label: t("wizard_recipients_all") },
              ]}
            />

            {audience === "BY_TAG" && tagChips.length > 0 && (
              <FilterChips
                chips={tagChips}
                selected={tagId}
                onChange={setTagId}
              />
            )}

            {audience === "INDIVIDUAL" && (
              <div className="space-y-1">
                {clients.isLoading && <ListSkeleton count={4} />}
                {!clients.isLoading &&
                  clients.data?.data.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleClient(c.id)}
                      className={
                        "w-full text-left rounded-md border-2 transition-colors " +
                        (selectedClientIds.has(c.id)
                          ? "border-[var(--wc-purple)] bg-[var(--wc-purple-50)]"
                          : "border-transparent hover:bg-[var(--wc-bg-muted)]")
                      }
                    >
                      <ListItem
                        title={c.name}
                        subtitle={c.phone}
                        separator={false}
                      />
                    </button>
                  ))}
              </div>
            )}

            <p className="text-body-small text-[var(--wc-fg-2)]">
              {recipientCount} {t("wizard_recipients_summary")}
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("wizard_message_title")}
            </h2>

            <div className="space-y-1">
              <p className="text-caption text-[var(--wc-fg-3)]">{t("title")}</p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("new_campaign")}
              />
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("wizard_message_placeholder")}
              className="w-full min-h-[120px] rounded-md border border-[var(--wc-border)] bg-white p-3 text-body-small text-[var(--wc-fg-1)] placeholder:text-[var(--wc-fg-3)] focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)]"
            />
            <p className="text-caption text-[var(--wc-fg-3)]">
              {t("wizard_message_variables")}
            </p>

            <div className="rounded-md bg-[var(--wc-purple-50)] p-3">
              <p className="text-body-small text-[var(--wc-purple)]">
                {t("wizard_ai_assist")}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => {
                  if (!name) return;
                  generateAi.mutate({ objective: name });
                }}
                loading={generateAi.isPending}
                disabled={generateAi.isPending || !name}
              >
                {t("wizard_ai_generate")}
              </Button>
              {generateAi.error && (
                <p className="mt-2 text-caption text-[var(--color-danger-text)]">
                  {generateAi.error.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-caption text-[var(--wc-fg-3)]">
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
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
              {t("wizard_review_title")}
            </h2>
            <p className="text-body-small text-[var(--wc-fg-2)]">
              {t("wizard_review_hint")}
            </p>
            <div className="space-y-2 rounded-md bg-[var(--wc-bg-muted)] p-3 text-body-small">
              <div className="flex justify-between">
                <span className="text-[var(--wc-fg-3)]">{t("title")}</span>
                <span className="text-[var(--wc-fg-1)]">{name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--wc-fg-3)]">{t("recipients")}</span>
                <span className="text-[var(--wc-fg-1)]">{recipientCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--wc-fg-3)]">{t("schedule")}</span>
                <span className="text-[var(--wc-fg-1)]">
                  {scheduledAt || tCommon("save")}
                </span>
              </div>
              <div className="border-t border-[var(--wc-border)] pt-2">
                <p className="text-[var(--wc-fg-3)]">
                  {t("wizard_message_title")}
                </p>
                <p className="mt-1 whitespace-pre-line text-[var(--wc-fg-1)]">
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
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={next} disabled={!canAdvance}>
              {tCommon("next")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              onClick={submit}
              loading={create.isPending}
              disabled={create.isPending || recipientCount === 0}
            >
              {t("wizard_confirm")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
