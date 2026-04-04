import type { Account } from '../domain/entities/account.entity';

export interface CreateAccountInput {
  email: string;
  name: string;
  passwordHash?: string | null;
  emailVerified?: Date | null;
}

export interface UpdateAccountInput {
  name?: string;
  email?: string;
  emailVerified?: Date | null;
  passwordHash?: string | null;
}

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  create(input: CreateAccountInput): Promise<Account>;
  update(id: string, input: UpdateAccountInput): Promise<Account>;
  delete(id: string): Promise<void>;
}
