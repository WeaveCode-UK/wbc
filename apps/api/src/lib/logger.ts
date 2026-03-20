import pino from 'pino';

export function createLogger(service: string) {
  return pino({
    name: `wbc-${service}`,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });
}
