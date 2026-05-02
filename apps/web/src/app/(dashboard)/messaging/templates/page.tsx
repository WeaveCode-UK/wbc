"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
      <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
        Templates de mensagem
      </h1>

      <SegmentedControl
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: "personal", label: "Meus + sistema" },
          { value: "community", label: "Comunidade" },
        ]}
      />

      {tab === "personal" && (
        <>
          <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-4 space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="PROMOTION"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Mensagem (use {{nome}})"
              className="w-full min-h-[80px] rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 text-body-small text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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

          <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
            {list.isLoading && <ListSkeleton count={3} />}
            {!list.isLoading && templates.length === 0 && (
              <EmptyState icon="📝" title="Nenhum template" />
            )}
            {templates.map((tpl) => (
              <ListItem
                key={tpl.id}
                title={tpl.name}
                subtitle={tpl.text.slice(0, 60)}
                right={
                  <div className="flex gap-2">
                    <Badge variant={tpl.isSystem ? "info" : "neutral"}>
                      {tpl.isSystem ? "sistema" : "meu"}
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
        <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
          {community.isLoading && <ListSkeleton count={3} />}
          {!community.isLoading && feed.length === 0 && (
            <EmptyState icon="💜" title="Feed vazio" />
          )}
          {feed.map((tpl) => (
            <ListItem
              key={tpl.id}
              title={tpl.text.slice(0, 80)}
              subtitle={tpl.topic ?? ""}
              right={
                <span className="text-caption text-[var(--color-text-tertiary)]">
                  ❤️ {tpl.likes ?? 0}
                </span>
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}
