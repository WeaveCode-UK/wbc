export type AppointmentType = 'VISIT' | 'DEMO' | 'BEAUTY_DAY' | 'DELIVERY' | 'OTHER';
export type ReminderType = 'RESTOCK' | 'BIRTHDAY' | 'PROFESSION_DAY' | 'CLIENT_ANNIVERSARY' | 'CUSTOM';
export type ReminderStatus = 'PENDING' | 'SENT' | 'DISMISSED';

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string | null;
  title: string;
  type: AppointmentType;
  address: string | null;
  notes: string | null;
  startsAt: Date;
  endsAt: Date | null;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  tenantId: string;
  clientId: string;
  type: ReminderType;
  message: string | null;
  triggerDate: Date;
  status: ReminderStatus;
  createdAt: Date;
}

export interface Opportunity {
  id: string;
  tenantId: string;
  clientId: string | null;
  type: string;
  description: string;
  scheduledAt: Date;
  status: string;
  createdAt: Date;
}
