import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../ports/password-hasher.port';

const COST_FACTOR = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, COST_FACTOR);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
