"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface Reply {
  id: string;
  label: string;
  text: string;
}

export default function QuickRepliesPage() {
  const tCommon = useTranslations("common");
  const tMsg = useTranslations("messaging");
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");

  const list = trpc.messaging.listQuickReplies.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.messaging.createQuickReply.useMutation({
    onSuccess: () => {
      setLabel("");
      setText("");
      void utils.messaging.listQuickReplies.invalidate();
    },
  });
  const del = trpc.messaging.deleteQuickReply.useMutation({
    onSuccess: () => void utils.messaging.listQuickReplies.invalidate(),
  });

  const replies = (list.data ?? []) as Reply[];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        {tMsg("quick_replies")}
      </h1>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-4 space-y-3 shadow-wc-xs">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={tMsg("quick_reply_label_placeholder")}
          maxLength={80}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tMsg("quick_reply_text_placeholder")}
          className="w-full min-h-[80px] rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 text-body-small text-[var(--wc-fg-1)] focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)]"
        />
        {create.error && <Alert variant="danger">{create.error.message}</Alert>}
        <Button
          type="button"
          onClick={() => label && text && create.mutate({ label, text })}
          disabled={create.isPending || !label || !text}
        >
          {tCommon("create")}
        </Button>
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 sm:p-4 shadow-wc-xs">
        {list.isLoading && <ListSkeleton count={3} />}
        {!list.isLoading && replies.length === 0 && (
          <EmptyState
            icon={
              <MessageSquare
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={tMsg("quick_replies_empty")}
          />
        )}
        {replies.map((r) => (
          <ListItem
            key={r.id}
            title={r.label}
            subtitle={r.text}
            right={
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => del.mutate({ id: r.id })}
              >
                {tCommon("delete")}
              </Button>
            }
          />
        ))}
      </section>
    </div>
  );
}
