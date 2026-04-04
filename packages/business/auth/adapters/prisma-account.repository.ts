import { prisma } from '@wbc/db';
import type { AccountRepository, CreateAccountInput, UpdateAccountInput } from '../ports/account.repository';
import { Account } from '../domain/entities/account.entity';

export class PrismaAccountRepository implements AccountRepository {
  async findById(id: string): Promise<Account | null> {
    const data = await prisma.account.findUnique({ where: { id } });
    if (!data) return null;
    return new Account(data);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const data = await prisma.account.findUnique({ where: { email } });
    if (!data) return null;
    return new Account(data);
  }

  async create(input: CreateAccountInput): Promise<Account> {
    const data = await prisma.account.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash ?? null,
        emailVerified: input.emailVerified ?? null,
      },
    });
    return new Account(data);
  }

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    const data = await prisma.account.update({
      where: { id },
      data: input,
    });
    return new Account(data);
  }

  async delete(id: string): Promise<void> {
    await prisma.account.delete({ where: { id } });
  }
}
