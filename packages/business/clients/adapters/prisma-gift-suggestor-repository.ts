import { prisma } from "@wbc/db";
import type {
  GiftSuggestor,
  GiftSuggestorRepository,
} from "../use-cases/manage-gift-suggestors";

// Bloco 4 do plano: schema GiftSuggestor já existe em schema.prisma:289.
// Aqui só implementamos o port. tenantId no where garante isolamento
// multi-tenant em todas as operações (defesa em profundidade — RLS já
// cuida no nível do PG).

export class PrismaGiftSuggestorRepository implements GiftSuggestorRepository {
  async list(tenantId: string, clientId: string): Promise<GiftSuggestor[]> {
    const rows = await prisma.giftSuggestor.findMany({
      where: { tenantId, clientId },
      orderBy: { suggestorName: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      suggestorName: r.suggestorName,
      suggestorPhone: r.suggestorPhone,
    }));
  }

  async add(
    tenantId: string,
    clientId: string,
    suggestorName: string,
    suggestorPhone: string,
  ): Promise<GiftSuggestor> {
    const row = await prisma.giftSuggestor.create({
      data: { tenantId, clientId, suggestorName, suggestorPhone },
    });
    return {
      id: row.id,
      clientId: row.clientId,
      suggestorName: row.suggestorName,
      suggestorPhone: row.suggestorPhone,
    };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await prisma.giftSuggestor.deleteMany({ where: { tenantId, id } });
  }
}
