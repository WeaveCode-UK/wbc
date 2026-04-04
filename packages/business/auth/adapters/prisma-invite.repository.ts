import { prisma } from '@wbc/db';
import type {
  InviteRepository,
  InviteData,
  InviteStatus,
  CreateInviteInput,
} from '../ports/invite.repository';

export class PrismaInviteRepository implements InviteRepository {
  async findById(id: string): Promise<InviteData | null> {
    const data = await prisma.invite.findUnique({ where: { id } });
    if (!data) return null;
    return data as InviteData;
  }

  async findByToken(token: string): Promise<InviteData | null> {
    const data = await prisma.invite.findUnique({ where: { token } });
    if (!data) return null;
    return data as InviteData;
  }

  async findByTenantId(tenantId: string, status?: InviteStatus): Promise<InviteData[]> {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    const data = await prisma.invite.findMany({ where, orderBy: { createdAt: 'desc' } });
    return data as InviteData[];
  }

  async create(input: CreateInviteInput): Promise<InviteData> {
    const data = await prisma.invite.create({ data: input });
    return data as InviteData;
  }

  async updateStatus(id: string, status: InviteStatus, acceptedAt?: Date): Promise<void> {
    const updateData: Record<string, unknown> = { status };
    if (acceptedAt) updateData.acceptedAt = acceptedAt;
    await prisma.invite.update({ where: { id }, data: updateData });
  }

  async expirePending(): Promise<number> {
    const result = await prisma.invite.updateMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  }
}
