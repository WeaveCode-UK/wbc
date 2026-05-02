"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
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
type BulkClassification = "A" | "B" | "C";

export default function ClientsPage() {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [tagId, setTagId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const list = trpc.clients.list.useQuery({
    page: 1,
    limit: 50,
    search: search || undefined,
    isLead: segment === "leads" ? true : undefined,
    tagIds: tagId ? [tagId] : undefined,
  });

  const tags = trpc.clients.listTags.useQuery();
  const utils = trpc.useUtils();
  const bulkUpdate = trpc.clients.bulkUpdate.useMutation({
    onSuccess: (result) => {
      setBulkNotice(`${result.count}`);
      setSelected(new Set());
      void utils.clients.list.invalidate();
    },
    onError: (err) => setBulkNotice(err.message),
  });

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyClassification = (classification: BulkClassification) => {
    if (selected.size === 0) return;
    setBulkNotice(null);
    bulkUpdate.mutate({
      ids: Array.from(selected),
      data: { classification },
    });
  };

  const applyActive = (isActive: boolean) => {
    if (selected.size === 0) return;
    setBulkNotice(null);
    bulkUpdate.mutate({
      ids: Array.from(selected),
      data: { isActive },
    });
  };

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

      {selected.size > 0 && (
        <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-surface)] p-3 flex flex-wrap gap-2 items-center">
          <span className="text-body-small text-[var(--color-primary)] mr-auto">
            {selected.size}
          </span>
          {(["A", "B", "C"] as const).map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => applyClassification(c)}
              disabled={bulkUpdate.isPending}
            >
              {t("classification")} {c}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => applyActive(true)}
            disabled={bulkUpdate.isPending}
          >
            ✓
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => applyActive(false)}
            disabled={bulkUpdate.isPending}
          >
            ✗
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            {tCommon("cancel")}
          </Button>
        </div>
      )}

      {bulkNotice && (
        <Alert variant={bulkUpdate.error ? "danger" : "success"}>
          {bulkNotice}
        </Alert>
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
          list.data.data.map((client) => {
            const isSelected = selected.has(client.id);
            return (
              <div
                key={client.id}
                className={
                  "flex items-center gap-2 rounded-md " +
                  (isSelected ? "bg-[var(--color-primary-surface)]" : "")
                }
              >
                <input
                  type="checkbox"
                  aria-label={`select ${client.name}`}
                  checked={isSelected}
                  onChange={() => toggleSelected(client.id)}
                  className="ml-2 h-4 w-4 accent-[var(--color-primary)]"
                />
                <Link href={`/clients/${client.id}`} className="flex-1">
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
              </div>
            );
          })}
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
