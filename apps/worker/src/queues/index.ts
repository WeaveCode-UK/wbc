import { Queue } from 'bullmq';
import { connection } from '../lib/redis';

// Queue definitions — handlers added during implementation
export const messagingQueue = new Queue('wbc:messaging', { connection });
export const campaignQueue = new Queue('wbc:campaigns', { connection });
export const scheduleQueue = new Queue('wbc:schedule', { connection });
export const analyticsQueue = new Queue('wbc:analytics', { connection });
export const outboxQueue = new Queue('wbc:outbox', { connection });
