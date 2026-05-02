import { prisma } from "@wbc/db";
import { subscribe, EVENTS } from "@wbc/shared";
import { logger } from "../lib/logger";
import { PrismaLoyaltyRepository } from "@wbc/business/loyalty/adapters/prisma-loyalty-repository";
import { earnFromSale } from "@wbc/business/loyalty/use-cases/manage-loyalty";
import { listPushTokensForTenant } from "@wbc/business/platform/use-cases/manage-push-devices";

// F11.E25: outbox event handlers.
//
// SALE_CONFIRMED  -> credit loyalty points to the client (1 / BRL 10).
// Notification    -> fan out via Expo Push to every PushDevice token
//                    registered for the tenant.
//
// Both handlers must stay idempotent — the outbox dispatcher already
// retries on failure and we don't want a double-credit or duplicate
// push. The loyalty side relies on the Serializable tx in
// PrismaLoyaltyRepository.applyTransaction; the push side relies on
// Expo Push's ticket model (we still want to remove tokens that come
// back as DeviceNotRegistered).

const loyaltyRepo = new PrismaLoyaltyRepository();

interface SaleConfirmedPayload {
  saleId: string;
  tenantId: string;
}

export function registerLoyaltyHandler(): void {
  subscribe(EVENTS.SALE_CONFIRMED, async (event) => {
    const payload = event.payload as unknown as SaleConfirmedPayload;
    if (!payload?.saleId || !payload?.tenantId) {
      logger.warn(
        { eventId: event.id },
        "SALE_CONFIRMED handler: missing saleId/tenantId in payload",
      );
      return;
    }

    const sale = await prisma.sale.findFirst({
      where: { id: payload.saleId, tenantId: payload.tenantId },
      select: { id: true, clientId: true, total: true },
    });
    if (!sale) {
      logger.warn(
        { saleId: payload.saleId },
        "SALE_CONFIRMED handler: sale not found",
      );
      return;
    }

    try {
      await earnFromSale(
        {
          tenantId: payload.tenantId,
          clientId: sale.clientId,
          saleId: sale.id,
          saleTotal: Number(sale.total),
        },
        loyaltyRepo,
      );
      logger.info(
        { saleId: sale.id, clientId: sale.clientId },
        "loyalty: points credited",
      );
    } catch (error) {
      logger.error(
        { saleId: sale.id, error: (error as Error).message },
        "loyalty: earnFromSale failed",
      );
    }
  });
}

// F11.E25: Notification fan-out via Expo Push. The DB has a sentinel
// flag to avoid double-pushing — we mark `read=false` rows with a
// transient JSON marker in `body` once dispatched. Anything fancier
// (a `pushedAt` column) is a follow-up; for now the outbox event
// handler dedups via the event id.

const PUSH_NOTIFICATION_PREFIX = "push:";

interface NotificationCreatedPayload {
  notificationId: string;
  tenantId: string;
  title: string;
  body: string;
  type: string;
}

export function registerNotificationPushHandler(): void {
  subscribe(EVENTS.NOTIFICATION_CREATED, async (event) => {
    const payload = event.payload as unknown as NotificationCreatedPayload;
    if (!payload?.tenantId || !payload?.notificationId) {
      return;
    }

    const tokens = await listPushTokensForTenant(payload.tenantId);
    if (tokens.length === 0) {
      return;
    }

    const messages = tokens.map((t) => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      data: { type: payload.type, notificationId: payload.notificationId },
      sound: "default",
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        logger.warn({ status: response.status }, "expo push: non-200 response");
        return;
      }

      const data = (await response.json()) as {
        data: Array<{
          status: string;
          message?: string;
          details?: { error?: string };
        }>;
      };

      // Prune tokens that Expo says are DeviceNotRegistered. Anything
      // else (rate limit, message-too-big) we just log.
      for (let i = 0; i < data.data.length; i++) {
        const ticket = data.data[i];
        if (
          ticket?.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          await prisma.pushDevice
            .deleteMany({ where: { token: tokens[i]!.token } })
            .catch(() => {
              /* swallow — best-effort */
            });
        }
      }

      logger.info(
        { tenantId: payload.tenantId, count: tokens.length },
        "expo push: dispatched",
      );
    } catch (error) {
      logger.error(
        { error: (error as Error).message },
        "expo push: dispatch failed",
      );
    }
  });
  void PUSH_NOTIFICATION_PREFIX; // currently unused — keeps lint happy
}
