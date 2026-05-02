import { prisma } from "@wbc/db";

// F11.E13: build the consultora's daily delivery route. A real TSP
// solver needs lat/long via geocoding (Google/MapBox API), which is
// queued for later. The MVP heuristic groups deliveries by the last
// recognisable address token (typically a neighbourhood or street),
// then sorts groups alphabetically and rows alphabetically within so
// the consultora visits the same neighbourhood back-to-back instead
// of zig-zagging across the city.

export interface RouteStop {
  deliveryId: string;
  saleId: string;
  clientId: string;
  clientName: string;
  address: string | null;
  groupKey: string;
  estimatedDays: number | null;
  status: string;
}

function groupKeyOf(address: string | null): string {
  if (!address) return "ZZZ_sem_endereco";
  // Heuristic: take the second-to-last comma-separated chunk
  // (typically the neighbourhood) — falls back to the whole address.
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return "ZZZ_sem_endereco";
  if (parts.length >= 2) return parts[parts.length - 2]!.toLowerCase();
  return parts[0]!.toLowerCase();
}

export async function buildDailyRoute(
  tenantId: string,
  date: Date,
): Promise<RouteStop[]> {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const deliveries = await prisma.delivery.findMany({
    where: {
      sale: { tenantId },
      status: { in: ["CONFIRMED", "SEPARATED", "SHIPPED"] },
    },
    select: {
      id: true,
      saleId: true,
      clientId: true,
      address: true,
      estimatedDays: true,
      status: true,
      createdAt: true,
    },
  });

  // Resolve client names in a single round-trip rather than relying on
  // a cross-table relation join (Delivery doesn't have a Prisma
  // relation to Client — it joins through Sale.clientId).
  const clientIds = Array.from(new Set(deliveries.map((d) => d.clientId)));
  const clients = await prisma.client.findMany({
    where: { tenantId, id: { in: clientIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(clients.map((c) => [c.id, c.name]));

  const inWindow = deliveries.filter(
    (d) =>
      (d.createdAt >= startOfDay && d.createdAt < endOfDay) ||
      d.status === "SHIPPED" ||
      d.status === "SEPARATED",
  );

  const stops: RouteStop[] = inWindow.map((d) => ({
    deliveryId: d.id,
    saleId: d.saleId,
    clientId: d.clientId,
    clientName: nameById.get(d.clientId) ?? "—",
    address: d.address,
    groupKey: groupKeyOf(d.address),
    estimatedDays: d.estimatedDays,
    status: d.status,
  }));

  stops.sort((a, b) => {
    if (a.groupKey !== b.groupKey)
      return a.groupKey.localeCompare(b.groupKey, "pt-BR");
    const left = a.address ?? "";
    const right = b.address ?? "";
    return left.localeCompare(right, "pt-BR");
  });

  return stops;
}
