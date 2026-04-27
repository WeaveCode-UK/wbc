import type { Account } from "../domain/entities/account.entity";

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
  deleteWithCleanup(accountId: string): Promise<void>;

  /**
   * ACH-009: stamp the last successful login. Best-effort — caller must
   * not block on it. Also clears `dormantNotifiedAt` so a re-activated
   * account stops being notified.
   */
  markLoggedIn(accountId: string, when: Date): Promise<void>;
}
