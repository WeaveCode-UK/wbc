import { prisma } from "@wbc/db";
import { publish, EVENTS } from "@wbc/shared";

// F11.E25: helper that creates a Notification row and publishes a
// NOTIFICATION_CREATED event so the worker's Expo Push handler can
// fan it out to the tenant's PushDevice tokens. Direct
// `prisma.notification.create` callers can migrate to this helper at
// their own pace; the event subscription is opt-in.

export interface CreatePushableNotificationInput {
  tenantId: string;
  type: string;
  title: string;
  body: string;
  /** When false, only the row is created (no push). Default: true. */
  pushable?: boolean;
}

export async function createPushableNotification(
  input: CreatePushableNotificationInput,
): Promise<{ id: string }> {
  const row = await prisma.notification.create({
    data: {
      tenantId: input.tenantId,
      type: input.type,
      title: input.title,
      body: input.body,
    },
    select: { id: true },
  });

  if (input.pushable !== false) {
    await publish(EVENTS.NOTIFICATION_CREATED, input.tenantId, {
      notificationId: row.id,
      tenantId: input.tenantId,
      title: input.title,
      body: input.body,
      type: input.type,
    });
  }

  return row;
}
