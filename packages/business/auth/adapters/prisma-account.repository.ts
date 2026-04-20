import { prisma } from "@wbc/db";
import type {
  AccountRepository,
  CreateAccountInput,
  UpdateAccountInput,
} from "../ports/account.repository";
import { Account } from "../domain/entities/account.entity";

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
    // ACH-008: whitelist updatable fields rather than passing `input` through
    // to Prisma. Stops any caller from setting totp*, recoveryCodes or
    // system-managed columns via a drifted schema on the router side.
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.emailVerified !== undefined)
      updateData.emailVerified = input.emailVerified;
    if (input.passwordHash !== undefined)
      updateData.passwordHash = input.passwordHash;

    const data = await prisma.account.update({
      where: { id },
      data: updateData,
    });
    return new Account(data);
  }

  async delete(id: string): Promise<void> {
    await prisma.account.delete({ where: { id } });
  }

  async deleteWithCleanup(accountId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: {
          email: `deleted_${accountId}@removed.wbc`,
          name: "Conta Removida",
          passwordHash: null,
        },
      });
      await tx.oAuthAccount.deleteMany({ where: { accountId } });
      await tx.session.deleteMany({ where: { accountId } });
      await tx.tenantMember.updateMany({
        where: { accountId },
        data: { deletedAt: new Date(), isActive: false },
      });
    });
  }
}
