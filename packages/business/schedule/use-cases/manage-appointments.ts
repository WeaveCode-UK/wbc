import { AppointmentNotFoundError } from '../domain/errors';
import type { ScheduleRepository } from '../ports/schedule-repository';

export async function listAppointments(tenantId: string, dateRange: { from: Date; to: Date } | undefined, repo: ScheduleRepository) {
  return repo.listAppointments(tenantId, dateRange);
}

export async function createAppointment(tenantId: string, data: { title: string; type: string; clientId?: string; address?: string; notes?: string; startsAt: Date; endsAt?: Date }, repo: ScheduleRepository) {
  return repo.createAppointment(tenantId, data);
}

export async function updateAppointment(tenantId: string, id: string, data: Record<string, unknown>, repo: ScheduleRepository) {
  const existing = await repo.findAppointment(tenantId, id);
  if (!existing) throw new AppointmentNotFoundError(id);
  return repo.updateAppointment(tenantId, id, data);
}

export async function deleteAppointment(tenantId: string, id: string, repo: ScheduleRepository) {
  const existing = await repo.findAppointment(tenantId, id);
  if (!existing) throw new AppointmentNotFoundError(id);
  await repo.deleteAppointment(tenantId, id);
}

export async function listReminders(tenantId: string, status: string | undefined, type: string | undefined, repo: ScheduleRepository) {
  return repo.listReminders(tenantId, status, type);
}

export async function dismissReminder(tenantId: string, id: string, repo: ScheduleRepository) {
  return repo.dismissReminder(tenantId, id);
}

export async function getUpcomingBirthdays(tenantId: string, days: number = 30, repo?: ScheduleRepository) {
  if (!repo) return [];
  return repo.getUpcomingBirthdays(tenantId, days);
}

export async function getMyDay(tenantId: string, repo: ScheduleRepository) {
  return repo.getMyDay(tenantId);
}

export async function getCalendar(tenantId: string, month: number, year: number, repo: ScheduleRepository) {
  return repo.getCalendar(tenantId, month, year);
}
