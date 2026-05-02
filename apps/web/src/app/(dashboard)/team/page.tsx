"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ListItem,
  ListSkeleton,
  SegmentedControl,
} from "@wbc/ui";
import { trpc } from "@/lib/trpc";

type Tab = "team" | "ranking" | "tasks";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function TeamPage() {
  const t = useTranslations("team");
  const [tab, setTab] = useState<Tab>("team");

  const team = trpc.team.getTeam.useQuery();
  const ranking = trpc.team.getRanking.useQuery();
  const tasks = trpc.team.listTasks.useQuery({});

  const teamData = team.data;
  const rankingData = ranking.data ?? [];
  const tasksData = tasks.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2 sm:text-heading-1 text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm">
          {t("add_member")}
        </Button>
      </div>

      <SegmentedControl
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: "team", label: t("title") },
          { value: "ranking", label: t("ranking") },
          { value: "tasks", label: t("tasks") },
        ]}
      />

      <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] p-2 sm:p-4">
        {tab === "team" && (
          <>
            {team.isLoading && <ListSkeleton count={2} />}
            {!team.isLoading && !teamData && (
              <EmptyState
                icon="👥"
                title={t("no_members")}
                description={t("no_members_hint")}
              />
            )}
            {!team.isLoading && teamData && (
              <ListItem
                avatar={<Avatar name={teamData.name} size="md" />}
                title={teamData.name}
                subtitle={t("role")}
              />
            )}
          </>
        )}

        {tab === "ranking" && (
          <>
            {ranking.isLoading && <ListSkeleton count={4} />}
            {!ranking.isLoading && rankingData.length === 0 && (
              <EmptyState icon="🏆" title={t("no_members")} />
            )}
            {!ranking.isLoading &&
              rankingData.map((r, idx) => (
                <ListItem
                  key={r.memberId}
                  avatar={<Avatar name={r.memberName} size="md" />}
                  title={`#${idx + 1} · ${r.memberName}`}
                  subtitle={`${r.totalSales} · ${formatBRL(Number(r.totalRevenue))}`}
                />
              ))}
          </>
        )}

        {tab === "tasks" && (
          <>
            {tasks.isLoading && <ListSkeleton count={4} />}
            {!tasks.isLoading && tasksData.length === 0 && (
              <EmptyState icon="✅" title={t("no_members")} />
            )}
            {!tasks.isLoading &&
              tasksData.map((task) => (
                <ListItem
                  key={task.id}
                  title={task.title}
                  subtitle={task.description ?? ""}
                  right={
                    <Badge
                      variant={
                        task.status === "COMPLETED"
                          ? "success"
                          : task.status === "PENDING"
                            ? "warning"
                            : "info"
                      }
                    >
                      {task.status}
                    </Badge>
                  }
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}
