"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, Trophy, Users } from "lucide-react";
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
import { AddMemberModal } from "../../../components/add-member-modal";

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
  const [addOpen, setAddOpen] = useState(false);

  const team = trpc.team.getTeam.useQuery();
  const members = trpc.team.listMembers.useQuery();
  const ranking = trpc.team.getRanking.useQuery();
  const tasks = trpc.team.listTasks.useQuery({});

  const teamData = team.data;
  const membersData = members.data ?? [];
  const rankingData = ranking.data ?? [];
  const tasksData = tasks.data ?? [];

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          {t("title")}
        </h1>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
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

      <div className="rounded-wc-lg border border-[var(--wc-border)] bg-white shadow-wc-xs p-2 sm:p-4">
        {tab === "team" && (
          <>
            {(team.isLoading || members.isLoading) && (
              <ListSkeleton count={3} />
            )}
            {!team.isLoading &&
              !members.isLoading &&
              !teamData &&
              membersData.length === 0 && (
                <EmptyState
                  icon={
                    <Users
                      className="h-5 w-5 text-[var(--wc-purple)]"
                      strokeWidth={1.75}
                    />
                  }
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
            {!members.isLoading &&
              membersData.map((m) => (
                <ListItem
                  key={m.id}
                  avatar={<Avatar name={m.name} size="md" />}
                  title={m.name}
                  subtitle={m.role}
                  right={
                    m.isActive ? undefined : (
                      <Badge variant="warning">inativa</Badge>
                    )
                  }
                />
              ))}
          </>
        )}

        {tab === "ranking" && (
          <>
            {ranking.isLoading && <ListSkeleton count={4} />}
            {!ranking.isLoading && rankingData.length === 0 && (
              <EmptyState
                icon={
                  <Trophy
                    className="h-5 w-5 text-[var(--wc-purple)]"
                    strokeWidth={1.75}
                  />
                }
                title={t("no_members")}
              />
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
              <EmptyState
                icon={
                  <CircleCheck
                    className="h-5 w-5 text-[var(--wc-success)]"
                    strokeWidth={1.75}
                  />
                }
                title={t("no_members")}
              />
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
      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
