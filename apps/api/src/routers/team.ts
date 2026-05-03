import { z } from "zod";
import {
  router,
  protectedProcedure,
  roleProtectedProcedure,
} from "../trpc/trpc";
import { PrismaTeamRepository } from "../../../../packages/business/team/adapters/prisma-team-repository";
import { PrismaTeamMemberRepository } from "../../../../packages/business/team/adapters/prisma-team-member-repository";
import { PrismaTeamTaskRepository } from "../../../../packages/business/team/adapters/prisma-team-task-repository";
import { createTeam } from "../../../../packages/business/team/use-cases/create-team";
import {
  addMember,
  listMembers,
  removeMember,
} from "../../../../packages/business/team/use-cases/manage-members";
import {
  createTask,
  listTasks,
  completeTask,
} from "../../../../packages/business/team/use-cases/manage-tasks";
import { getTeamRanking } from "../../../../packages/business/team/use-cases/get-ranking";
import { uuidSchema } from "@wbc/validators";

const teamRepo = new PrismaTeamRepository();
const memberRepo = new PrismaTeamMemberRepository();
const taskRepo = new PrismaTeamTaskRepository();

export const teamRouter = router({
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    return teamRepo.findByLeaderId(ctx.tenant.tenantId, ctx.tenant.userId);
  }),
  // F11.E26: list every member registered under the leader's team.
  // The /team page already hits getTeam (singular leader) — this
  // procedure surfaces the rest of the squad so the Team tab can
  // render the full roster.
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const team = await teamRepo.findByLeaderId(
      ctx.tenant.tenantId,
      ctx.tenant.userId,
    );
    if (!team) return [];
    return listMembers(memberRepo, ctx.tenant.tenantId, team.id);
  }),
  addMember: roleProtectedProcedure("LEADER")
    .input(
      z.object({
        phone: z.string(),
        name: z.string().default(""),
        role: z
          .enum(["CONSULTANT", "LEADER", "DIRECTOR", "ADMIN"])
          .default("CONSULTANT"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let team = await teamRepo.findByLeaderId(
        ctx.tenant.tenantId,
        ctx.tenant.userId,
      );
      if (!team)
        team = await createTeam(teamRepo, {
          tenantId: ctx.tenant.tenantId,
          name: "Minha Equipe",
          leaderId: ctx.tenant.userId,
        });
      return addMember(memberRepo, {
        tenantId: ctx.tenant.tenantId,
        teamId: team.id,
        name: input.name,
        phone: input.phone,
        role: input.role,
      });
    }),
  removeMember: roleProtectedProcedure("LEADER")
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await removeMember(memberRepo, ctx.tenant.tenantId, input.memberId);
      return { success: true };
    }),
  listTasks: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const team = await teamRepo.findByLeaderId(
        ctx.tenant.tenantId,
        ctx.tenant.userId,
      );
      if (!team) return [];
      return listTasks(
        taskRepo,
        ctx.tenant.tenantId,
        team.id,
        input.status ? { status: input.status } : undefined,
      );
    }),
  createTask: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        assigneeId: z.string().optional(),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = await teamRepo.findByLeaderId(
        ctx.tenant.tenantId,
        ctx.tenant.userId,
      );
      if (!team) throw new Error("Team not found");
      return createTask(taskRepo, {
        tenantId: ctx.tenant.tenantId,
        teamId: team.id,
        ...input,
      });
    }),
  completeTask: protectedProcedure
    .input(z.object({ taskId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return completeTask(taskRepo, ctx.tenant.tenantId, input.taskId);
    }),
  getRanking: protectedProcedure.query(async ({ ctx }) => {
    const team = await teamRepo.findByLeaderId(
      ctx.tenant.tenantId,
      ctx.tenant.userId,
    );
    if (!team) return [];
    return getTeamRanking(ctx.tenant.tenantId, team.id, memberRepo);
  }),
});
