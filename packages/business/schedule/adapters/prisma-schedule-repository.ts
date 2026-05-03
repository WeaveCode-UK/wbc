import { prisma } from "@wbc/db";
import { buildTenantWhere, paginatedQuery } from "@wbc/shared";
import type {
  ScheduleRepository,
  NotificationRepository,
} from "../ports/schedule-repository";

export class PrismaScheduleRepository implements ScheduleRepository {
  async listAppointments(
    tenantId: string,
    dateRange?: { from: Date; to: Date },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (dateRange) where.startsAt = { gte: dateRange.from, lte: dateRange.to };
    return prisma.appointment.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 200,
    });
  }

  async createAppointment(
    tenantId: string,
    data: {
      title: string;
      type: string;
      clientId?: string;
      address?: string;
      notes?: string;
      startsAt: Date;
      endsAt?: Date;
    },
  ) {
    return prisma.appointment.create({
      data: {
        tenantId,
        title: data.title,
        type: data.type as
          | "VISIT"
          | "DEMO"
          | "BEAUTY_DAY"
          | "DELIVERY"
          | "OTHER",
        clientId: data.clientId,
        address: data.address,
        notes: data.notes,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });
  }

  async findAppointment(tenantId: string, id: string) {
    return prisma.appointment.findFirst({ where: { id, tenantId } });
  }

  async updateAppointment(
    tenantId: string,
    id: string,
    data: Record<string, unknown>,
  ) {
    return prisma.appointment.update({ where: { id }, data });
  }

  async deleteAppointment(tenantId: string, id: string) {
    await prisma.appointment.delete({ where: { id } });
  }

  async listReminders(tenantId: string, status?: string, type?: string) {
    const where = buildTenantWhere(tenantId, { status, type });
    return prisma.reminder.findMany({
      where,
      orderBy: { triggerDate: "asc" },
      take: 200,
    });
  }

  async dismissReminder(tenantId: string, id: string) {
    return prisma.reminder.update({
      where: { id },
      data: { status: "DISMISSED" },
    });
  }

  async getUpcomingBirthdays(tenantId: string, days: number) {
    // Birthdays are stored with a real year, but "upcoming" means
    // proximity by month/day to today regardless of birth year. Prisma
    // can't express that filter natively without raw SQL, so we pull
    // candidates (capped) and refine in JS. The cap protects the API
    // event loop from a tenant with tens of thousands of clients —
    // see incident note in CLAUDE.md about /schedule blocking the
    // request pool.
    const MAX_CANDIDATES = 5000;
    const MAX_RESULTS = 100;

    const candidates = await prisma.client.findMany({
      where: { tenantId, birthday: { not: null }, isActive: true },
      select: { id: true, name: true, phone: true, birthday: true },
      take: MAX_CANDIDATES,
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const horizonMs = days * 24 * 60 * 60 * 1000;

    const ranked: Array<{
      id: string;
      name: string;
      phone: string | null;
      birthday: Date | null;
      _distance: number;
    }> = [];
    for (const c of candidates) {
      if (!c.birthday) continue;
      const b = new Date(c.birthday);
      const thisYear = new Date(today.getFullYear(), b.getMonth(), b.getDate());
      const next =
        thisYear.getTime() < today.getTime()
          ? new Date(today.getFullYear() + 1, b.getMonth(), b.getDate())
          : thisYear;
      const distance = next.getTime() - today.getTime();
      if (distance <= horizonMs) ranked.push({ ...c, _distance: distance });
    }
    ranked.sort((a, b) => a._distance - b._distance);
    return ranked
      .slice(0, MAX_RESULTS)
      .map(({ _distance: _, ...rest }) => rest);
  }

  async getMyDay(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const [reminders, appointments, pendingBillings] = await Promise.all([
      prisma.reminder.findMany({
        where: { tenantId, status: "PENDING", triggerDate: { lte: todayEnd } },
        take: 20,
      }),
      prisma.appointment.findMany({
        where: { tenantId, startsAt: { gte: todayStart, lte: todayEnd } },
        orderBy: { startsAt: "asc" },
      }),
      prisma.payment.findMany({
        where: { status: { in: ["PENDING", "OVERDUE"] }, sale: { tenantId } },
        take: 10,
        include: { sale: { select: { clientId: true } } },
      }),
    ]);

    return {
      reminders,
      appointments,
      pendingBillings,
      birthdays: [],
      opportunities: [],
    };
  }

  async getCalendar(tenantId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return prisma.opportunity.findMany({
      where: { tenantId, scheduledAt: { gte: startDate, lte: endDate } },
      orderBy: { scheduledAt: "asc" },
    });
  }
}

export class PrismaNotificationRepository implements NotificationRepository {
  async list(tenantId: string, page: number, limit: number) {
    const where = { tenantId };
    const [result, unread] = await Promise.all([
      paginatedQuery(prisma.notification as never, where, { page, limit }),
      prisma.notification.count({ where: { tenantId, read: false } }),
    ]);
    return { ...result, unread };
  }

  async markAsRead(tenantId: string, id: string) {
    return prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllAsRead(tenantId: string) {
    await prisma.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  async create(tenantId: string, title: string, body: string, type: string) {
    await prisma.notification.create({ data: { tenantId, title, body, type } });
  }
}
