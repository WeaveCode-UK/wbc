"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  FilterChips,
  ListItem,
  ListSkeleton,
  SearchBar,
  SegmentedControl,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

type Segment = "all" | "leads";

export default function ClientsPage() {
  const t = useTranslations("clients");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [tagId, setTagId] = useState<string | null>(null);

  const list = trpc.clients.list.useQuery({
    page: 1,
    limit: 50,
    search: search || undefined,
    isLead: segment === "leads" ? true : undefined,
    tagIds: tagId ? [tagId] : undefined,
  });

  const tags = trpc.clients.listTags.useQuery();

  const tagChips = (tags.data ?? []).map((tag) => ({
    value: tag.id,
    label: tag.name,
    color: tag.color ?? undefined,
  }));

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm">
          {t("add_client")}
        </Button>
      </div>

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch("")}
        placeholder={t("name")}
      />

      <SegmentedControl
        value={segment}
        onChange={(v) => setSegment(v as Segment)}
        options={[
          { value: "all", label: t("title") },
          { value: "leads", label: t("leads") },
        ]}
      />

      {tagChips.length > 0 && (
        <FilterChips chips={tagChips} selected={tagId} onChange={setTagId} />
      )}

      <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={6} />}

        {!list.isLoading && (list.data?.data.length ?? 0) === 0 && (
          <EmptyState
            icon="👥"
            title={t("no_clients")}
            description={t("no_clients_hint")}
            action={
              <Button type="button" size="sm">
                {t("add_client")}
              </Button>
            }
          />
        )}

        {!list.isLoading &&
          list.data &&
          list.data.data.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <ListItem
                avatar={
                  <Avatar
                    name={client.name}
                    size="md"
                    classification={
                      client.classification as "A" | "B" | "C" | undefined
                    }
                  />
                }
                title={client.name}
                subtitle={client.phone}
                right={
                  <div className="flex items-center gap-2">
                    {client.isLead && (
                      <Badge variant="info">{t("leads")}</Badge>
                    )}
                    <span className="text-caption text-[var(--color-text-tertiary)]">
                      {client.classification}
                    </span>
                  </div>
                }
              />
            </Link>
          ))}
      </div>

      {list.data?.meta && (
        <p className="text-caption text-[var(--color-text-tertiary)] text-right">
          {list.data.meta.total} · {list.data.meta.page}/
          {Math.ceil(list.data.meta.total / list.data.meta.limit) || 1}
        </p>
      )}
    </div>
  );
}
