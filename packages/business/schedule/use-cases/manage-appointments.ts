import { prisma } from '@wbc/db';
import { AppointmentNotFoundError } from '../domain/errors';

export async function listAppointments(tenantId: string, dateRange?: { from: Date; to: Date }) {
  const where: Record<string, unknown> = { tenantId };
  if (dateRange) where.startsAt = { gte: dateRange.from, lte: dateRange.to };
  return prisma.appointment.findMany({ where, orderBy: { startsAt: 'asc' } });
}

export async function createAppointment(tenantId: string, data: { title: string; type: string; clientId?: string; address?: string; notes?: string; startsAt: Date; endsAt?: Date }) {
  return prisma.appointment.create({
    data: { tenantId, title: data.title, type: data.type as 'VISIT' | 'DEMO' | 'BEAUTY_DAY' | 'DELIVERY' | 'OTHER', clientId: data.clientId, address: data.address, notes: data.notes, startsAt: data.startsAt, endsAt: data.endsAt },
  });
}

export async function updateAppointment(tenantId: string, id: string, data: Record<string, unknown>) {
  const existing = await prisma.appointment.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppointmentNotFoundError(id);
  return prisma.appointment.update({ where: { id }, data });
}

export async function deleteAppointment(tenantId: string, id: string) {
  const existing = await prisma.appointment.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppointmentNotFoundError(id);
  await prisma.appointment.delete({ where: { id } });
}

export async function listReminders(tenantId: string, status?: string, type?: string) {
  const where: Record<string, unknown> = { tenantId };
  if (status) where.status = status;
  if (type) where.type = type;
  return prisma.reminder.findMany({ where, orderBy: { triggerDate: 'asc' } });
}

export async function dismissReminder(tenantId: string, id: string) {
  return prisma.reminder.update({ where: { id }, data: { status: 'DISMISSED' } });
}

export async function getUpcomingBirthdays(tenantId: string, days: number = 30) {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);

  return prisma.client.findMany({
    where: { tenantId, birthday: { not: null }, isActive: true },
    select: { id: true, name: true, phone: true, birthday: true },
    orderBy: { birthday: 'asc' },
  });
}

export async function getMyDay(tenantId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const [reminders, appointments, pendingBillings] = await Promise.all([
    prisma.reminder.findMany({ where: { tenantId, status: 'PENDING', triggerDate: { lte: todayEnd } }, take: 20 }),
    prisma.appointment.findMany({ where: { tenantId, startsAt: { gte: todayStart, lte: todayEnd } }, orderBy: { startsAt: 'asc' } }),
    prisma.payment.findMany({ where: { status: { in: ['PENDING', 'OVERDUE'] }, sale: { tenantId } }, take: 10, include: { sale: { select: { clientId: true } } } }),
  ]);

  return { reminders, appointments, pendingBillings, birthdays: [], opportunities: [] };
}

export async function getCalendar(tenantId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const opportunities = await prisma.opportunity.findMany({
    where: { tenantId, scheduledAt: { gte: startDate, lte: endDate } },
    orderBy: { scheduledAt: 'asc' },
  });

  return opportunities;
}
