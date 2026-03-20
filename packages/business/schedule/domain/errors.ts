export class AppointmentNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Appointment not found: ${id}` : 'Appointment not found'); this.name = 'AppointmentNotFoundError'; }
}
export class ReminderNotFoundError extends Error {
  constructor(id?: string) { super(id ? `Reminder not found: ${id}` : 'Reminder not found'); this.name = 'ReminderNotFoundError'; }
}
