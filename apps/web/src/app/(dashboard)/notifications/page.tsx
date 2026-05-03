"use client";

import { useTranslations } from "next-intl";
import { Bell, Check } from "lucide-react";
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
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Notificações
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

      <section className="space-y-2">
        {list.isLoading && <ListSkeleton count={5} />}
        {!list.isLoading && items.length === 0 && (
          <div className="rounded-wc-lg border border-[var(--wc-border)] bg-white p-2 sm:p-4 shadow-wc-xs">
            <EmptyState
              icon={
                <Bell
                  className="h-5 w-5 text-[var(--wc-purple)]"
                  strokeWidth={1.75}
                />
              }
              title="Sem notificações"
            />
          </div>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={
              "rounded-wc-md border border-[var(--wc-border)] bg-white p-4 transition-all duration-150 hover:shadow-wc-xs hover:-translate-y-px " +
              (!n.read ? "bg-[var(--wc-purple-50)]" : "")
            }
          >
            <ListItem
              title={n.title}
              subtitle={`${formatDateTime(n.createdAt)} · ${n.body}`}
              separator={false}
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
                      <Check className="h-4 w-4" strokeWidth={2} />
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
