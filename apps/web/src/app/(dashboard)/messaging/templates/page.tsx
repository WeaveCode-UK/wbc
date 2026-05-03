"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Heart } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
  SegmentedControl,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface Template {
  id: string;
  name: string;
  category: string;
  text: string;
  isSystem?: boolean;
  variant?: number;
}

interface CommunityTpl {
  id: string;
  text: string;
  topic: string | null;
  likes?: number;
}

type Tab = "personal" | "community";

export default function TemplatesPage() {
  const tCommon = useTranslations("common");
  const tMsg = useTranslations("messaging");
  const [tab, setTab] = useState<Tab>("personal");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("PROMOTION");

  const list = trpc.messaging.listTemplates.useQuery({});
  const community = trpc.messaging.listCommunityTemplates.useQuery({
    page: 1,
    limit: 20,
  });
  const utils = trpc.useUtils();
  const create = trpc.messaging.createTemplate.useMutation({
    onSuccess: () => {
      setName("");
      setText("");
      void utils.messaging.listTemplates.invalidate();
    },
  });
  const del = trpc.messaging.deleteTemplate.useMutation({
    onSuccess: () => void utils.messaging.listTemplates.invalidate(),
  });
  const share = trpc.messaging.shareToFeed.useMutation({
    onSuccess: () => void utils.messaging.listCommunityTemplates.invalidate(),
  });

  const templates = (list.data ?? []) as Template[];
  const feed = (community.data ?? []) as CommunityTpl[];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        {tMsg("templates_title")}
      </h1>

      <SegmentedControl
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: "personal", label: tMsg("templates_tab_personal") },
          { value: "community", label: tMsg("templates_tab_community") },
        ]}
      />

      {tab === "personal" && (
        <>
          <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-4 space-y-3 shadow-wc-xs">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tMsg("template_name_placeholder")}
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={tMsg("template_category_placeholder")}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={tMsg("template_text_placeholder", {
                placeholder: "{{nome}}",
              })}
              className="w-full min-h-[80px] rounded-md border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 text-body-small text-[var(--wc-fg-1)] focus:outline-none focus:ring-2 focus:ring-[var(--wc-purple)]"
            />
            {create.error && (
              <Alert variant="danger">{create.error.message}</Alert>
            )}
            <Button
              type="button"
              onClick={() =>
                name && text && create.mutate({ name, category, text })
              }
              disabled={create.isPending || !name || !text}
            >
              {tCommon("create")}
            </Button>
          </section>

          <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 sm:p-4 shadow-wc-xs">
            {list.isLoading && <ListSkeleton count={3} />}
            {!list.isLoading && templates.length === 0 && (
              <EmptyState
                icon={
                  <FileText
                    className="h-5 w-5 text-[var(--wc-purple)]"
                    strokeWidth={1.75}
                  />
                }
                title={tMsg("templates_empty")}
              />
            )}
            {templates.map((tpl) => (
              <ListItem
                key={tpl.id}
                title={tpl.name}
                subtitle={tpl.text}
                right={
                  <div className="flex gap-2">
                    <Badge variant={tpl.isSystem ? "info" : "neutral"}>
                      {tpl.isSystem
                        ? tMsg("template_badge_system")
                        : tMsg("template_badge_mine")}
                    </Badge>
                    {!tpl.isSystem && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => share.mutate({ text: tpl.text })}
                          disabled={share.isPending}
                        >
                          ↗
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => del.mutate({ id: tpl.id })}
                        >
                          ×
                        </Button>
                      </>
                    )}
                  </div>
                }
              />
            ))}
          </section>
        </>
      )}

      {tab === "community" && (
        <section className="rounded-wc-lg border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-2 sm:p-4 shadow-wc-xs">
          {community.isLoading && <ListSkeleton count={3} />}
          {!community.isLoading && feed.length === 0 && (
            <EmptyState
              icon={
                <Heart
                  className="h-5 w-5 text-[var(--wc-purple)]"
                  strokeWidth={1.75}
                />
              }
              title={tMsg("community_empty")}
            />
          )}
          {feed.map((tpl) => (
            <ListItem
              key={tpl.id}
              title={tpl.text}
              subtitle={tpl.topic ?? ""}
              right={
                <span className="text-caption text-[var(--wc-fg-3)]">
                  <Heart
                    className="inline h-3 w-3 mr-1 text-[var(--wc-error)]"
                    strokeWidth={1.75}
                  />{" "}
                  {tpl.likes ?? 0}
                </span>
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}
