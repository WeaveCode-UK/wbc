import { prisma } from "@wbc/db";

// F11.E13: scan for client dates that should trigger a reminder today —
// birthdays, profession days (if known) and one-year client anniversary.
// Idempotent: skips when a PENDING reminder of the same kind already
// exists for the same client and day.

export interface DateRemindersReport {
  scanned: number;
  birthdays: number;
  anniversaries: number;
  professionDays: number;
}

// Mapping of profession → date (month-day). The list mirrors the
// most common Brazilian profession celebrations the spec calls out.
// Extending it later is a one-line addition.
const PROFESSION_DAYS: Record<string, string> = {
  professor: "10-15",
  professora: "10-15",
  medico: "10-18",
  médica: "10-18",
  medica: "10-18",
  enfermeiro: "05-12",
  enfermeira: "05-12",
  advogado: "08-11",
  advogada: "08-11",
  engenheiro: "12-11",
  engenheira: "12-11",
};

function todayMonthDay(now: Date): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${m}-${d}`;
}

async function ensureReminder(
  tenantId: string,
  clientId: string,
  type: "BIRTHDAY" | "PROFESSION_DAY" | "CLIENT_ANNIVERSARY",
  triggerDate: Date,
  message: string,
): Promise<boolean> {
  const existing = await prisma.reminder.findFirst({
    where: {
      tenantId,
      clientId,
      type,
      status: "PENDING",
      triggerDate,
    },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.reminder.create({
    data: { tenantId, clientId, type, triggerDate, message },
  });
  return true;
}

export async function buildDateReminders(
  tenantId: string,
): Promise<DateRemindersReport> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayMD = todayMonthDay(now);

  const clients = await prisma.client.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      name: true,
      birthday: true,
      profession: true,
      firstPurchaseAt: true,
    },
  });

  let birthdays = 0;
  let anniversaries = 0;
  let professionDays = 0;

  for (const c of clients) {
    if (c.birthday) {
      const b = c.birthday;
      const bMD = `${String(b.getUTCMonth() + 1).padStart(2, "0")}-${String(
        b.getUTCDate(),
      ).padStart(2, "0")}`;
      if (bMD === todayMD) {
        if (
          await ensureReminder(
            tenantId,
            c.id,
            "BIRTHDAY",
            today,
            `🎂 Hoje é aniversário da ${c.name}!`,
          )
        ) {
          birthdays++;
        }
      }
    }

    if (c.firstPurchaseAt) {
      const fp = c.firstPurchaseAt;
      const fpMD = `${String(fp.getUTCMonth() + 1).padStart(2, "0")}-${String(
        fp.getUTCDate(),
      ).padStart(2, "0")}`;
      if (fpMD === todayMD && fp.getUTCFullYear() < now.getUTCFullYear()) {
        const yearsAsClient = now.getUTCFullYear() - fp.getUTCFullYear();
        if (
          await ensureReminder(
            tenantId,
            c.id,
            "CLIENT_ANNIVERSARY",
            today,
            `🥂 ${c.name} é cliente há ${yearsAsClient} ${
              yearsAsClient === 1 ? "ano" : "anos"
            }!`,
          )
        ) {
          anniversaries++;
        }
      }
    }

    if (c.profession) {
      const key = c.profession.toLowerCase().normalize("NFD");
      const md =
        PROFESSION_DAYS[key] ?? PROFESSION_DAYS[c.profession.toLowerCase()];
      if (md && md === todayMD) {
        if (
          await ensureReminder(
            tenantId,
            c.id,
            "PROFESSION_DAY",
            today,
            `Hoje é o dia de ${c.profession}, ${c.name}.`,
          )
        ) {
          professionDays++;
        }
      }
    }
  }

  return {
    scanned: clients.length,
    birthdays,
    anniversaries,
    professionDays,
  };
}
