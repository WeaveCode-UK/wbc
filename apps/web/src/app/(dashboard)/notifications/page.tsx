"use client";

import { useTranslations } from "next-intl";
import { Badge, Button, EmptyState, ListItem, ListSkeleton } from "@wbc/ui";
import { trpc } from "@/lib/trpc";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
}

function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default function NotificationsPage() {
  const tCommon = useTranslations("common");
  const list = trpc.schedule.listNotifications.useQuery({ page: 1, limit: 50 });
  const utils = trpc.useUtils();
  const markRead = trpc.schedule.markNotificationRead.useMutation({
    onSuccess: () => void utils.schedule.listNotifications.invalidate(),
  });
  const markAll = trpc.schedule.markAllNotificationsRead.useMutation({
    onSuccess: () => void utils.schedule.listNotifications.invalidate(),
  });

  const data = list.data;
  const items = (data?.data ?? []) as NotificationRow[];
  const unread = data?.unread ?? 0;

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          🔔 Notificações
          {unread > 0 && (
            <Badge variant="danger" className="ml-2">
              {String(unread)}
            </Badge>
          )}
        </h1>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || unread === 0}
        >
          Marcar todas como lidas
        </Button>
      </div>

      <section className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {list.isLoading && <ListSkeleton count={5} />}
        {!list.isLoading && items.length === 0 && (
          <EmptyState icon="🔔" title="Sem notificações" />
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={
              !n.read ? "rounded-md bg-[var(--color-primary-surface)] mb-1" : ""
            }
          >
            <ListItem
              title={n.title}
              subtitle={`${formatDateTime(n.createdAt)} · ${n.body}`}
              right={
                <div className="flex gap-2">
                  <Badge variant="neutral">{n.type}</Badge>
                  {!n.read && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => markRead.mutate({ id: n.id })}
                    >
                      ✓
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        ))}
      </section>
    </div>
  );
}
