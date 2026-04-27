export interface AccountProps {
  id: string;
  email: string;
  emailVerified: Date | null;
  passwordHash: string | null;
  name: string;
  // ACH-003: surfaced to the credentials use-case so it knows whether to
  // demand a TOTP token after the password verifies.
  totpEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Account {
  constructor(private readonly props: AccountProps) {}

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get emailVerified(): Date | null {
    return this.props.emailVerified;
  }
  get passwordHash(): string | null {
    return this.props.passwordHash;
  }
  get name(): string {
    return this.props.name;
  }
  get totpEnabled(): boolean {
    return this.props.totpEnabled === true;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasPassword(): boolean {
    return this.props.passwordHash !== null;
  }

  isEmailVerified(): boolean {
    return this.props.emailVerified !== null;
  }
}
