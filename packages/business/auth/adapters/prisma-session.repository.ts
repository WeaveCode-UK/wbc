import { prisma } from '@wbc/db';
import type { SessionRepository, CreateSessionInput } from '../ports/session.repository';
import { Session } from '../domain/entities/session.entity';

export class PrismaSessionRepository implements SessionRepository {
  async findById(id: string): Promise<Session | null> {
    const data = await prisma.session.findUnique({ where: { id } });
    if (!data) return null;
    return new Session(data);
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const data = await prisma.session.findUnique({ where: { tokenHash } });
    if (!data) return null;
    return new Session(data);
  }

  async findByAccountId(accountId: string): Promise<Session[]> {
    const data = await prisma.session.findMany({ where: { accountId }, orderBy: { lastUsedAt: 'desc' } });
    return data.map((d) => new Session(d));
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const data = await prisma.session.create({ data: input });
    return new Session(data);
  }

  async updateLastUsed(id: string, expiresAt: Date): Promise<void> {
    await prisma.session.update({
      where: { id },
      data: { lastUsedAt: new Date(), expiresAt },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.session.delete({ where: { id } });
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { accountId } });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
