import Redis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379/0';

let redis: Redis | undefined;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) {
          logger.error('Redis connection failed after 10 retries — giving up');
          return null;
        }
        const delay = Math.min(times * 500, 5000);
        logger.warn({ attempt: times, delay }, 'Redis reconnecting...');
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
        return targetErrors.some((e) => err.message.includes(e));
      },
      enableReadyCheck: true,
      lazyConnect: false,
    });
    redis.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis connection error');
    });
    redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return redis;
}
