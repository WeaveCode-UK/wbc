export class Password {
  private constructor(private readonly value: string) {}

  static create(value: string): Password {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[a-zA-Z]/.test(value)) {
      throw new Error('Password must contain at least one letter');
    }
    if (!/[0-9]/.test(value)) {
      throw new Error('Password must contain at least one number');
    }
    return new Password(value);
  }

  toString(): string {
    return this.value;
  }
}
