export interface ScheduleRepository {
  listAppointments(tenantId: string, dateRange?: { from: Date; to: Date }): Promise<unknown[]>;
  createAppointment(tenantId: string, data: { title: string; type: string; clientId?: string; address?: string; notes?: string; startsAt: Date; endsAt?: Date }): Promise<unknown>;
  findAppointment(tenantId: string, id: string): Promise<unknown | null>;
  updateAppointment(tenantId: string, id: string, data: Record<string, unknown>): Promise<unknown>;
  deleteAppointment(tenantId: string, id: string): Promise<void>;
  listReminders(tenantId: string, status?: string, type?: string): Promise<unknown[]>;
  dismissReminder(tenantId: string, id: string): Promise<unknown>;
  getUpcomingBirthdays(tenantId: string, days: number): Promise<unknown[]>;
  getMyDay(tenantId: string): Promise<{ reminders: unknown[]; appointments: unknown[]; pendingBillings: unknown[]; birthdays: unknown[]; opportunities: unknown[] }>;
  getCalendar(tenantId: string, month: number, year: number): Promise<unknown[]>;
}

export interface NotificationRepository {
  list(tenantId: string, page: number, limit: number): Promise<{ data: unknown[]; total: number; unread: number }>;
  markAsRead(tenantId: string, id: string): Promise<unknown>;
  markAllAsRead(tenantId: string): Promise<{ success: boolean }>;
  create(tenantId: string, title: string, body: string, type: string): Promise<void>;
}
