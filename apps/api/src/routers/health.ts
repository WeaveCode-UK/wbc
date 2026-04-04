import { router, publicProcedure } from '../trpc/trpc';
import { getRedis } from '../lib/redis';
import { createLogger } from '../lib/logger';
import { prisma } from '@wbc/db';

const logger = createLogger('health');

export const healthRouter = router({
  redis: publicProcedure.query(async () => {
    try {
      const redis = getRedis();
      const pong = await redis.ping();
      return { status: 'ok', response: pong };
    } catch (error) {
      logger.error({ error }, 'Redis health check failed');
      return { status: 'error' };
    }
  }),

  db: publicProcedure.query(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return { status: 'error' };
    }
  }),
});
