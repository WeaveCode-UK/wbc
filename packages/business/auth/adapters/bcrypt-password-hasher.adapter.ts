import type { PasswordHasher } from '../ports/password-hasher.port';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as { hash: (s: string, n: number) => Promise<string>; compare: (s: string, h: string) => Promise<boolean> };

const COST_FACTOR = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, COST_FACTOR);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
