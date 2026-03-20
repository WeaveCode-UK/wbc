import { router, publicProcedure } from '../trpc/trpc';
import { getRedis } from '../lib/redis';
import { prisma } from '@wbc/db';

export const healthRouter = router({
  redis: publicProcedure.query(async () => {
    try {
      const redis = getRedis();
      const pong = await redis.ping();
      return { status: 'ok', response: pong };
    } catch (error) {
      return { status: 'error', response: String(error) };
    }
  }),

  db: publicProcedure.query(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', response: String(error) };
    }
  }),
});
