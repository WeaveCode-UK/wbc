"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import {
  Alert,
  Button,
  EmptyState,
  Input,
  ListItem,
  ListSkeleton,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

export default function TagsPage() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8127E8");

  const list = trpc.clients.listTags.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.clients.createTag.useMutation({
    onSuccess: () => {
      setName("");
      void utils.clients.listTags.invalidate();
    },
  });
  const del = trpc.clients.deleteTag.useMutation({
    onSuccess: () => void utils.clients.listTags.invalidate(),
  });

  const tags = list.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
        {t("tags")}
      </h1>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-5 space-y-3">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
          />
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16"
          />
          <Button
            type="button"
            onClick={() => name && create.mutate({ name, color })}
            disabled={create.isPending || !name}
          >
            {tCommon("create")}
          </Button>
        </div>
        {create.error && <Alert variant="danger">{create.error.message}</Alert>}
      </section>

      <section className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={4} />}
        {!list.isLoading && tags.length === 0 && (
          <EmptyState
            icon={
              <Tag
                className="h-5 w-5 text-[var(--wc-purple)]"
                strokeWidth={1.75}
              />
            }
            title={t("tags")}
          />
        )}
        {tags.map((tag) => (
          <ListItem
            key={tag.id}
            avatar={
              <span
                className="block h-3 w-3 rounded-full"
                style={{ backgroundColor: tag.color ?? "#999" }}
              />
            }
            title={tag.name}
            right={
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => del.mutate({ id: tag.id })}
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
