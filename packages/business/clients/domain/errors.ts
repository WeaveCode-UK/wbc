export class ClientNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Client not found: ${id}` : 'Client not found');
    this.name = 'ClientNotFoundError';
  }
}

export class DuplicatePhoneError extends Error {
  constructor(phone: string) {
    super(`Phone already registered: ${phone}`);
    this.name = 'DuplicatePhoneError';
  }
}

export class TagNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Tag not found: ${id}` : 'Tag not found');
    this.name = 'TagNotFoundError';
  }
}

export class DuplicateTagError extends Error {
  constructor(name: string) {
    super(`Tag already exists: ${name}`);
    this.name = 'DuplicateTagError';
  }
}

export class InvalidClientDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidClientDataError';
  }
}
