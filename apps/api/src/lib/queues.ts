import { Queue } from 'bullmq';
import { getRedis } from './redis';

let analyticsQueue: Queue | null = null;
let campaignQueue: Queue | null = null;
let messagingQueue: Queue | null = null;

function getConnection() {
  return getRedis();
}

export function getAnalyticsQueue(): Queue {
  if (!analyticsQueue) {
    analyticsQueue = new Queue('wbc:analytics', { connection: getConnection() });
  }
  return analyticsQueue;
}

export function getCampaignQueue(): Queue {
  if (!campaignQueue) {
    campaignQueue = new Queue('wbc:campaigns', { connection: getConnection() });
  }
  return campaignQueue;
}

export function getMessagingQueue(): Queue {
  if (!messagingQueue) {
    messagingQueue = new Queue('wbc:messaging', { connection: getConnection() });
  }
  return messagingQueue;
}
